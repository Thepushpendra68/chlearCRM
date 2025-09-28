const { supabaseAdmin } = require('../config/supabase');
const assignmentService = require('./assignmentService');
const AssignmentRules = require('../utils/assignmentRules');

class RoutingService {
  /**
   * Auto-assign lead based on rules
   * @param {string} leadId - Lead ID
   * @param {string} assignedBy - User ID who triggered the assignment
   * @returns {Object} - Assignment result
   */
  async autoAssignLead(leadId, assignedBy = null) {
    try {
      // Get lead data
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        throw new Error('Lead not found');
      }

      // Check if lead is already assigned
      if (lead.assigned_to) {
        return { success: true, message: 'Lead is already assigned', assignedTo: lead.assigned_to };
      }

      // Get active assignment rules
      const rulesResult = await assignmentService.getActiveRules();
      if (!rulesResult.success) {
        throw new Error(rulesResult.error);
      }

      const rules = rulesResult.data;
      if (rules.length === 0) {
        // No rules available, use round-robin as fallback
        return await this.roundRobinAssignment(leadId, assignedBy);
      }

      // Evaluate rules against lead data
      const matchingRule = AssignmentRules.evaluateRules(lead, rules);

      if (!matchingRule) {
        // No rule matches, use round-robin as fallback
        return await this.roundRobinAssignment(leadId, assignedBy);
      }

      // Execute assignment based on rule type
      let assignedTo = null;
      let assignmentSource = 'rule';

      switch (matchingRule.assignment_type) {
        case 'specific_user':
          assignedTo = matchingRule.assigned_to;
          break;

        case 'round_robin':
          const roundRobinResult = await this.getRoundRobinUser();
          if (roundRobinResult.success) {
            assignedTo = roundRobinResult.data;
          }
          break;

        case 'team':
          // For team assignment, we'll use round-robin among team members
          const teamResult = await this.getTeamRoundRobinUser();
          if (teamResult.success) {
            assignedTo = teamResult.data;
          }
          break;

        default:
          throw new Error(`Unknown assignment type: ${matchingRule.assignment_type}`);
      }

      if (!assignedTo) {
        throw new Error('No user available for assignment');
      }

      // Assign the lead
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
          assignment_source: assignmentSource,
          assignment_rule_id: matchingRule.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        throw updateError;
      }

      // Record assignment history
      const { error: historyError } = await supabaseAdmin
        .from('lead_assignment_history')
        .insert({
          lead_id: leadId,
          previous_assigned_to: null,
          new_assigned_to: assignedTo,
          assigned_by: assignedBy,
          assignment_reason: `Auto-assigned by rule: ${matchingRule.name}`
        });

      if (historyError) {
        console.error('Failed to record assignment history:', historyError);
        // Don't fail the assignment if history recording fails
      }

      return {
        success: true,
        message: `Lead assigned by rule: ${matchingRule.name}`,
        assignedTo,
        rule: matchingRule
      };
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Round-robin assignment among all active users
   * @param {string} leadId - Lead ID
   * @param {string} assignedBy - User ID who triggered the assignment
   * @returns {Object} - Assignment result
   */
  async roundRobinAssignment(leadId, assignedBy = null) {
    try {
      // Get next user in round-robin sequence
      const userResult = await this.getRoundRobinUser();
      if (!userResult.success) {
        throw new Error(userResult.error);
      }

      const assignedTo = userResult.data;

      // Assign the lead
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
          assignment_source: 'auto',
          assignment_rule_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        throw updateError;
      }

      // Record assignment history
      const { error: historyError } = await supabaseAdmin
        .from('lead_assignment_history')
        .insert({
          lead_id: leadId,
          previous_assigned_to: null,
          new_assigned_to: assignedTo,
          assigned_by: assignedBy,
          assignment_reason: 'Round-robin assignment'
        });

      if (historyError) {
        console.error('Failed to record assignment history:', historyError);
        // Don't fail the assignment if history recording fails
      }

      return {
        success: true,
        message: 'Lead assigned using round-robin',
        assignedTo
      };
    } catch (error) {
      console.error('Error in round-robin assignment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get next user in round-robin sequence
   * @returns {Object} - User result
   */
  async getRoundRobinUser() {
    try {
      // Get all active users from user_profiles (excluding admins)
      const { data: users, error: usersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('is_active', true)
        .neq('role', 'super_admin')
        .neq('role', 'company_admin')
        .order('id', { ascending: true });

      if (usersError || !users || users.length === 0) {
        return { success: false, error: 'No active users available for assignment' };
      }

      // Get current assignment counts for each user
      const { data: assignmentCounts, error: countsError } = await supabaseAdmin
        .from('leads')
        .select('assigned_to')
        .not('assigned_to', 'is', null);

      if (countsError) {
        console.error('Error getting assignment counts:', countsError);
        return { success: false, error: 'Failed to get assignment counts' };
      }

      // Count assignments per user
      const countsMap = {};
      assignmentCounts.forEach(item => {
        countsMap[item.assigned_to] = (countsMap[item.assigned_to] || 0) + 1;
      });

      // Find user with minimum assignments
      let minCount = Infinity;
      let selectedUser = null;

      for (const user of users) {
        const count = countsMap[user.id] || 0;
        if (count < minCount) {
          minCount = count;
          selectedUser = user;
        }
      }

      if (!selectedUser) {
        return { success: false, error: 'No user found for assignment' };
      }

      return { success: true, data: selectedUser.id };
    } catch (error) {
      console.error('Error getting round-robin user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get next user in team round-robin sequence
   * @returns {Object} - User result
   */
  async getTeamRoundRobinUser() {
    try {
      // For now, this is the same as regular round-robin
      // In the future, this could be enhanced to work with specific teams
      return await this.getRoundRobinUser();
    } catch (error) {
      console.error('Error getting team round-robin user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process auto-assignment for multiple leads
   * @param {Array} leadIds - Array of lead IDs
   * @param {string} assignedBy - User ID who triggered the assignment
   * @returns {Object} - Assignment results
   */
  async processBulkAutoAssignment(leadIds, assignedBy = null) {
    try {
      const results = [];

      for (const leadId of leadIds) {
        const result = await this.autoAssignLead(leadId, assignedBy);
        results.push({
          leadId,
          success: result.success,
          message: result.message,
          assignedTo: result.assignedTo,
          error: result.error
        });
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Bulk auto-assignment completed: ${successCount} successful, ${errorCount} failed`,
        results
      };
    } catch (error) {
      console.error('Error in bulk auto-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reassign lead to different user
   * @param {string} leadId - Lead ID
   * @param {string} newAssignedTo - New user ID
   * @param {string} assignedBy - User ID who triggered the reassignment
   * @param {string} reason - Reason for reassignment
   * @returns {Object} - Reassignment result
   */
  async reassignLead(leadId, newAssignedTo, assignedBy, reason = 'Manual reassignment') {
    try {
      return await assignmentService.assignLead(leadId, newAssignedTo, assignedBy, reason);
    } catch (error) {
      console.error('Error reassigning lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get assignment recommendations for a lead
   * @param {string} leadId - Lead ID
   * @returns {Object} - Recommendation result
   */
  async getAssignmentRecommendations(leadId) {
    try {
      // Get lead data
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Get active rules
      const rulesResult = await assignmentService.getActiveRules();
      if (!rulesResult.success) {
        return rulesResult;
      }

      const rules = rulesResult.data;
      const recommendations = [];

      // Evaluate each rule
      for (const rule of rules) {
        if (AssignmentRules.evaluateRule(lead, rule)) {
          let recommendedUser = null;

          switch (rule.assignment_type) {
            case 'specific_user':
              recommendedUser = rule.assigned_to;
              break;
            case 'round_robin':
            case 'team':
              const userResult = await this.getRoundRobinUser();
              if (userResult.success) {
                recommendedUser = userResult.data;
              }
              break;
          }

          if (recommendedUser) {
            recommendations.push({
              rule,
              recommendedUser,
              confidence: rule.priority / 10 // Convert priority to confidence score
            });
          }
        }
      }

      // Sort by confidence (highest first)
      recommendations.sort((a, b) => b.confidence - a.confidence);

      return {
        success: true,
        data: {
          lead,
          recommendations
        }
      };
    } catch (error) {
      console.error('Error getting assignment recommendations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get routing statistics
   * @returns {Object} - Statistics result
   */
  async getRoutingStats() {
    try {
      // Get basic statistics
      const { data: leads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('assigned_to, assignment_source');

      if (leadsError) {
        console.error('Error getting leads for stats:', leadsError);
        return { success: false, error: error.message };
      }

      const totalLeads = leads.length;
      const assignedLeads = leads.filter(l => l.assigned_to).length;
      const autoAssigned = leads.filter(l => l.assignment_source === 'auto').length;
      const ruleAssigned = leads.filter(l => l.assignment_source === 'rule').length;
      const manuallyAssigned = leads.filter(l => l.assignment_source === 'manual').length;

      const stats = {
        total_leads: totalLeads,
        assigned_leads: assignedLeads,
        auto_assigned: autoAssigned,
        rule_assigned: ruleAssigned,
        manually_assigned: manuallyAssigned
      };

      // Get rule usage statistics
      const { data: ruleStats, error: ruleStatsError } = await supabaseAdmin
        .from('lead_assignment_rules')
        .select(`
          id,
          name,
          leads!lead_assignment_rules_id_fkey(count)
        `)
        .eq('is_active', true);

      if (ruleStatsError) {
        console.error('Error getting rule stats:', ruleStatsError);
        return {
          success: true,
          data: {
            ...stats,
            ruleUsage: []
          }
        };
      }

      // Format rule usage data
      const formattedRuleStats = ruleStats.map(rule => ({
        rule_id: rule.id,
        rule_name: rule.name,
        usage_count: rule.leads?.length || 0
      })).sort((a, b) => b.usage_count - a.usage_count);

      return {
        success: true,
        data: {
          ...stats,
          ruleUsage: formattedRuleStats
        }
      };
    } catch (error) {
      console.error('Error getting routing stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RoutingService();
