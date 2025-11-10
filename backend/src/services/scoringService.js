const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const { body, validationResult } = require('express-validator');

/**
 * Calculate and update a lead's score based on all scoring events
 */
const calculateLeadScore = async (leadId) => {
  try {
    // Get all score events for this lead
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('activity_score_events')
      .select('points')
      .eq('lead_id', leadId);

    if (eventsError) {
      throw new ApiError(500, `Failed to fetch score events: ${eventsError.message}`);
    }

    // Calculate total score
    const totalScore = events.reduce((sum, event) => sum + event.points, 0);

    // Ensure score is within bounds (0-100)
    const boundedScore = Math.max(0, Math.min(100, totalScore));

    // Get lead info to get company_id
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('company_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new ApiError(404, 'Lead not found');
    }

    // Update or insert the score
    const { data: score, error: scoreError } = await supabaseAdmin
      .from('lead_scores')
      .upsert({
        lead_id: leadId,
        company_id: lead.company_id,
        current_score: boundedScore,
        last_calculated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (scoreError) {
      throw new ApiError(500, `Failed to update score: ${scoreError.message}`);
    }

    return score;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to calculate lead score: ${error.message}`);
  }
};

/**
 * Apply score for a specific activity
 */
const applyActivityScore = async (leadId, activityId, activityType, user) => {
  try {
    // Get all active scoring rules for the company and activity type
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('scoring_rules')
      .select('*')
      .eq('company_id', user.company_id)
      .eq('rule_type', 'activity')
      .eq('activity_type', activityType)
      .eq('is_active', true);

    if (rulesError) {
      throw new ApiError(500, `Failed to fetch scoring rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      // No rules found for this activity type, no score change
      return null;
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, company_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new ApiError(404, 'Lead not found');
    }

    // Apply each matching rule
    const scoreEvents = [];
    for (const rule of rules) {
      const { data: event, error: eventError } = await supabaseAdmin
        .from('activity_score_events')
        .insert({
          lead_id: leadId,
          company_id: user.company_id,
          activity_id: activityId,
          rule_id: rule.id,
          points: rule.score_value,
          reason: `${rule.name} (${rule.activity_type})`
        })
        .select()
        .single();

      if (eventError) {
        console.error(`Failed to create score event: ${eventError.message}`);
        continue;
      }

      scoreEvents.push(event);
    }

    // Recalculate the lead's total score
    await calculateLeadScore(leadId);

    return scoreEvents;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to apply activity score: ${error.message}`);
  }
};

/**
 * Apply score for a field change
 */
const applyFieldScore = async (leadId, fieldName, oldValue, newValue, user) => {
  try {
    // Get all active scoring rules for the company and field
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('scoring_rules')
      .select('*')
      .eq('company_id', user.company_id)
      .eq('rule_type', 'field')
      .eq('field_name', fieldName)
      .eq('is_active', true);

    if (rulesError) {
      throw new ApiError(500, `Failed to fetch scoring rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      return null;
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, company_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new ApiError(404, 'Lead not found');
    }

    // Evaluate each rule
    const scoreEvents = [];
    for (const rule of rules) {
      let shouldApply = false;

      // Convert values for comparison
      const compareValue = convertValueForComparison(rule.condition_operator, rule.condition_value);
      const currentValue = convertValueForComparison(rule.condition_operator, newValue);

      // Evaluate condition
      shouldApply = evaluateCondition(currentValue, compareValue, rule.condition_operator);

      if (shouldApply) {
        const { data: event, error: eventError } = await supabaseAdmin
          .from('activity_score_events')
          .insert({
            lead_id: leadId,
            company_id: user.company_id,
            activity_id: null,
            rule_id: rule.id,
            points: rule.score_value,
            reason: `${rule.name} (${fieldName} ${rule.condition_operator} ${rule.condition_value})`
          })
          .select()
          .single();

        if (eventError) {
          console.error(`Failed to create score event: ${eventError.message}`);
          continue;
        }

        scoreEvents.push(event);
      }
    }

    // Recalculate the lead's total score
    await calculateLeadScore(leadId);

    return scoreEvents;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to apply field score: ${error.message}`);
  }
};

/**
 * Get current score for a lead
 */
const getLeadScore = async (leadId) => {
  try {
    const { data: score, error } = await supabaseAdmin
      .from('lead_scores')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new ApiError(500, `Failed to fetch score: ${error.message}`);
    }

    return score || { current_score: 0 };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to get lead score: ${error.message}`);
  }
};

/**
 * Get score breakdown/history for a lead
 */
const getScoreBreakdown = async (leadId, user) => {
  try {
    // Get score events with rule details
    const { data: events, error } = await supabaseAdmin
      .from('activity_score_events')
      .select(`
        id,
        points,
        reason,
        created_at,
        scoring_rules(name, description, rule_type, activity_type)
      `)
      .eq('lead_id', leadId)
      .eq('company_id', user.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, `Failed to fetch score breakdown: ${error.message}`);
    }

    // Get current score
    const currentScore = await getLeadScore(leadId);

    return {
      current_score: currentScore?.current_score || 0,
      events: events || []
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to get score breakdown: ${error.message}`);
  }
};

/**
 * Get all scoring rules for a company
 */
const getScoringRules = async (user) => {
  try {
    const { data: rules, error } = await supabaseAdmin
      .from('scoring_rules')
      .select('*')
      .eq('company_id', user.company_id)
      .order('rule_type', { ascending: true });

    if (error) {
      throw new ApiError(500, `Failed to fetch scoring rules: ${error.message}`);
    }

    return rules || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to get scoring rules: ${error.message}`);
  }
};

/**
 * Create a new scoring rule
 */
const createScoringRule = async (ruleData, user) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('scoring_rules')
      .insert({
        ...ruleData,
        company_id: user.company_id
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, `Failed to create scoring rule: ${error.message}`);
    }

    return rule;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to create scoring rule: ${error.message}`);
  }
};

/**
 * Update a scoring rule
 */
const updateScoringRule = async (ruleId, ruleData, user) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('scoring_rules')
      .update(ruleData)
      .eq('id', ruleId)
      .eq('company_id', user.company_id)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, `Failed to update scoring rule: ${error.message}`);
    }

    if (!rule) {
      throw new ApiError(404, 'Scoring rule not found');
    }

    // Recalculate all scores for the company
    await recalculateAllScores(user);

    return rule;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to update scoring rule: ${error.message}`);
  }
};

/**
 * Delete a scoring rule
 */
const deleteScoringRule = async (ruleId, user) => {
  try {
    const { error } = await supabaseAdmin
      .from('scoring_rules')
      .delete()
      .eq('id', ruleId)
      .eq('company_id', user.company_id);

    if (error) {
      throw new ApiError(500, `Failed to delete scoring rule: ${error.message}`);
    }

    // Recalculate all scores for the company
    await recalculateAllScores(user);

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to delete scoring rule: ${error.message}`);
  }
};

/**
 * Recalculate all scores for a company
 */
const recalculateAllScores = async (user) => {
  try {
    // Get all leads for the company
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('company_id', user.company_id);

    if (leadsError) {
      throw new ApiError(500, `Failed to fetch leads: ${leadsError.message}`);
    }

    let updatedCount = 0;
    for (const lead of leads || []) {
      await calculateLeadScore(lead.id);
      updatedCount++;
    }

    return { updatedCount };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to recalculate scores: ${error.message}`);
  }
};

/**
 * Create default scoring rules for a new company
 */
const createDefaultScoringRules = async (companyId) => {
  try {
    const defaultRules = [
      // Activity-based rules
      { name: 'Email Opened', description: 'Points for opening an email', rule_type: 'activity', activity_type: 'email_opened', score_value: 10, is_active: true },
      { name: 'Email Clicked', description: 'Points for clicking a link in email', rule_type: 'activity', activity_type: 'email_clicked', score_value: 15, is_active: true },
      { name: 'Call Completed', description: 'Points for completing a call', rule_type: 'activity', activity_type: 'call', score_value: 15, is_active: true },
      { name: 'Meeting Scheduled', description: 'Points for scheduling a meeting', rule_type: 'activity', activity_type: 'meeting', score_value: 20, is_active: true },
      { name: 'Form Submitted', description: 'Points for submitting a form', rule_type: 'activity', activity_type: 'form_submit', score_value: 25, is_active: true },
      { name: 'Note Added', description: 'Points for adding a note', rule_type: 'activity', activity_type: 'note', score_value: 5, is_active: true },
      { name: 'Task Completed', description: 'Points for completing a task', rule_type: 'activity', activity_type: 'task', score_value: 10, is_active: true },

      // Field-based rules
      { name: 'High Deal Value', description: 'Points for high-value deals', rule_type: 'field', field_name: 'deal_value', condition_operator: '>', condition_value: '10000', score_value: 20, is_active: true },
      { name: 'Referral Source', description: 'Points for referral source', rule_type: 'field', field_name: 'source', condition_operator: '=', condition_value: 'referral', score_value: 25, is_active: true },

      // Engagement rules
      { name: 'No Activity - 7 Days', description: 'Penalty for no activity in 7 days', rule_type: 'engagement', score_value: -5, is_active: true },
      { name: 'No Activity - 30 Days', description: 'Penalty for no activity in 30 days', rule_type: 'engagement', score_value: -15, is_active: true }
    ];

    const rulesToInsert = defaultRules.map(rule => ({
      ...rule,
      company_id: companyId
    }));

    const { data: rules, error } = await supabaseAdmin
      .from('scoring_rules')
      .insert(rulesToInsert)
      .select();

    if (error) {
      throw new ApiError(500, `Failed to create default rules: ${error.message}`);
    }

    return rules;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to create default scoring rules: ${error.message}`);
  }
};

/**
 * Helper function to convert values for comparison
 */
const convertValueForComparison = (operator, value) => {
  if (value === null || value === undefined) return value;

  // Try to convert to number if it's a numeric comparison
  if (['>', '<', '>=', '<='].includes(operator)) {
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
  }

  return value;
};

/**
 * Helper function to evaluate conditions
 */
const evaluateCondition = (currentValue, compareValue, operator) => {
  switch (operator) {
    case '>':
      return currentValue > compareValue;
    case '<':
      return currentValue < compareValue;
    case '>=':
      return currentValue >= compareValue;
    case '<=':
      return currentValue <= compareValue;
    case '=':
    case '==':
      return currentValue == compareValue;
    case '!=':
    case '<>':
      return currentValue != compareValue;
    default:
      return false;
  }
};

module.exports = {
  calculateLeadScore,
  applyActivityScore,
  applyFieldScore,
  getLeadScore,
  getScoreBreakdown,
  getScoringRules,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
  recalculateAllScores,
  createDefaultScoringRules
};
