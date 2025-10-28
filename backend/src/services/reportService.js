const { supabaseAdmin } = require('../config/supabase');
const reportGenerator = require('../utils/reportGenerator');

/**
 * Get lead performance metrics
 */
const getLeadPerformanceMetrics = async (currentUser, filters = {}) => {
  try {
    const supabase = supabaseAdmin;
    const { dateFrom, dateTo, userId, pipelineStageId, source, industry } = filters;
    
    // Build base query
    let query = supabase
      .from('leads')
      .select(`
        *,
        pipeline_stages!leads_pipeline_stage_id_fkey(is_closed_won, is_closed_lost)
      `)
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (userId) {
      query = query.eq('assigned_to', userId);
    }

    if (pipelineStageId) {
      query = query.eq('pipeline_stage_id', pipelineStageId);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      throw new Error(`Failed to get lead performance metrics: ${leadsError.message}`);
    }

    // Calculate basic lead metrics
    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.pipeline_stages?.is_closed_won).length;
    const lostLeads = leads.filter(lead => lead.pipeline_stages?.is_closed_lost).length;
    const activeLeads = leads.filter(lead => lead.pipeline_stage_id !== null).length;
    const avgDealValue = leads.filter(lead => lead.deal_value).reduce((sum, lead) => sum + lead.deal_value, 0) / leads.filter(lead => lead.deal_value).length || 0;
    const totalDealValue = leads.filter(lead => lead.deal_value).reduce((sum, lead) => sum + lead.deal_value, 0);
    // Note: probability field doesn't exist in current schema, using 0 as default
    const avgProbability = 0;

    const leadMetrics = {
      total_leads: totalLeads,
      won_leads: wonLeads,
      lost_leads: lostLeads,
      active_leads: activeLeads,
      avg_deal_value: avgDealValue,
      total_deal_value: totalDealValue,
      avg_probability: avgProbability
    };

    // Get conversion rates by stage
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select(`
        id,
        name,
        order_position
      `)
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .order('order_position', { ascending: true });

    if (stagesError) {
      console.error('Pipeline stages error:', stagesError);
      // Continue with empty stages array
    }

    const conversionData = [];

    for (const stage of stages || []) {
      const stageLeads = leads.filter(lead => lead.pipeline_stage_id === stage.id);
      const leadCount = stageLeads.length;
      // Note: probability field doesn't exist in current schema, using 0 as default
      const avgProbability = 0;
      const totalValue = stageLeads.filter(lead => lead.deal_value).reduce((sum, lead) => sum + lead.deal_value, 0);

      conversionData.push({
        stage_name: stage.name,
        order_position: stage.order_position,
        lead_count: leadCount,
        avg_probability: avgProbability,
        total_value: totalValue
      });
    }

    // Get response time metrics (simplified - would need activity data)
    const responseTime = {
      avg_response_time_hours: 0,
      responded_within_24h: 0,
      responded_within_1h: 0
    };

    return {
      leadMetrics,
      conversionData,
      responseTime,
      filters: filters
    };
  } catch (error) {
    throw new Error(`Failed to get lead performance metrics: ${error.message}`);
  }
};

/**
 * Get conversion funnel analysis
 */
const getConversionFunnel = async (currentUser, filters = {}) => {
  try {
    const supabase = supabaseAdmin;
    const { dateFrom, dateTo, userId } = filters;
    
    // Get pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name, order_position')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .order('order_position', { ascending: true });

    if (stagesError) {
      console.error('Pipeline stages error:', stagesError);
      // Continue with empty stages array
    }

    // Get leads with filters
    let query = supabase
      .from('leads')
      .select('pipeline_stage_id')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('assigned_to', currentUser.id);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (userId) {
      query = query.eq('assigned_to', userId);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      throw new Error(`Failed to get leads: ${leadsError.message}`);
    }

    // Calculate funnel data
    const funnelData = [];
    let previousStageCount = 0;

    for (const stage of stages || []) {
      const stageLeads = leads.filter(lead => lead.pipeline_stage_id === stage.id);
      const leadCount = stageLeads.length;
      const conversionRate = previousStageCount > 0 ? (leadCount / previousStageCount) * 100 : 100;

      funnelData.push({
        stage_name: stage.name,
        order_position: stage.order_position,
        lead_count: leadCount,
        previous_stage_count: previousStageCount,
        conversion_rate: Math.round(conversionRate * 100) / 100
      });

      previousStageCount = leadCount;
    }

    // Calculate overall conversion rate
    const totalLeads = funnelData.reduce((sum, stage) => sum + stage.lead_count, 0);
    const wonLeads = funnelData.find(stage => stage.stage_name.toLowerCase().includes('won'))?.lead_count || 0;
    const overallConversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    return {
      funnelData,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      totalLeads,
      wonLeads
    };
  } catch (error) {
    throw new Error(`Failed to get conversion funnel: ${error.message}`);
  }
};

/**
 * Get activity summary reports
 */
const getActivitySummary = async (currentUser, filters = {}) => {
  try {
    const supabase = supabaseAdmin;
    const { dateFrom, dateTo, userId, activityType, leadId } = filters;

    // Return empty data structure if no company to prevent errors
    if (!currentUser?.company_id) {
      return {
        activitySummary: [],
        dailyTrends: [],
        outcomeAnalysis: [],
        filters: filters
      };
    }
    
    // Build base query
    let query = supabase
      .from('activities')
      .select(`
        type,
        metadata,
        lead_id,
        user_id,
        company_id,
        created_at
      `)
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their own activities
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      query = query.eq('user_id', currentUser.id);
    }

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (activityType) {
      query = query.eq('type', activityType);
    }

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      throw new Error(`Failed to get activities: ${activitiesError.message}`);
    }

    // Get activity summary by type
    const activitySummary = {};
    const uniqueLeads = new Set();
    const uniqueUsers = new Set();

    for (const activity of activities || []) {
      const type = activity.type || 'unknown';

      if (!activitySummary[type]) {
        activitySummary[type] = {
          activity_type: type,
          total_activities: 0,
          completed_activities: 0,
          avg_duration_minutes: 0,
          unique_leads_contacted: 0,
          unique_users: 0
        };
      }

      activitySummary[type].total_activities++;

      // Check if completed (simplified - would need completed_at field)
      if (activity.metadata?.completed) {
        activitySummary[type].completed_activities++;
      }

      // Track unique leads and users
      if (activity.lead_id) {
        uniqueLeads.add(activity.lead_id);
      }
      if (activity.user_id) {
        uniqueUsers.add(activity.user_id);
      }
    }

    // Calculate averages and finalize
    for (const type in activitySummary) {
      activitySummary[type].unique_leads_contacted = uniqueLeads.size;
      activitySummary[type].unique_users = uniqueUsers.size;
    }

    // Get daily activity trends
    const dailyTrends = {};
    for (const activity of activities || []) {
      if (!activity.created_at) continue; // Skip activities without created_at

      const date = new Date(activity.created_at).toISOString().split('T')[0];
      const type = activity.type || 'unknown';

      if (!dailyTrends[date]) {
        dailyTrends[date] = {};
      }

      if (!dailyTrends[date][type]) {
        dailyTrends[date][type] = 0;
      }

      dailyTrends[date][type]++;
    }

    // Convert to array format
    const dailyTrendsArray = [];
    for (const date in dailyTrends) {
      for (const type in dailyTrends[date]) {
        dailyTrendsArray.push({
          activity_date: date,
          activity_type: type,
          activity_count: dailyTrends[date][type]
        });
      }
    }

    // Get outcome analysis (simplified)
    const outcomeAnalysis = [];

    return {
      activitySummary: Object.values(activitySummary),
      dailyTrends: dailyTrendsArray.slice(0, 30), // Limit to 30 days
      outcomeAnalysis,
      filters: filters
    };
  } catch (error) {
    throw new Error(`Failed to get activity summary: ${error.message}`);
  }
};

/**
 * Get team performance metrics
 */
const getTeamPerformanceMetrics = async (currentUser, filters = {}) => {
  try {
    const supabase = supabaseAdmin;

    // Return empty data structure if no filters to prevent errors
    if (!currentUser?.company_id) {
      return {
        team_metrics: [],
        total_team_performance: {
          total_leads: 0,
          won_leads: 0,
          lost_leads: 0,
          total_revenue: 0,
          avg_deal_size: 0
        }
      };
    }
    const { dateFrom, dateTo, teamId } = filters;
    
    // Get users in the company
    let userQuery = supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('company_id', currentUser.company_id)
      .neq('role', 'super_admin');

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      console.error('Users error in team performance:', usersError);
      return {
        team_metrics: [],
        total_team_performance: {
          total_leads: 0,
          won_leads: 0,
          lost_leads: 0,
          total_revenue: 0,
          avg_deal_size: 0
        }
      };
    }

    // Get leads with filters
    let leadQuery = supabase
      .from('leads')
      .select(`
        assigned_to,
        pipeline_stage_id,
        deal_value
      `)
      .eq('company_id', currentUser.company_id);

    if (dateFrom) {
      leadQuery = leadQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      leadQuery = leadQuery.lte('created_at', dateTo);
    }

    const { data: leads, error: leadsError } = await leadQuery;

    if (leadsError) {
      throw new Error(`Failed to get leads: ${leadsError.message}`);
    }

    // Get activities with filters
    let activityQuery = supabase
      .from('activities')
      .select('user_id')
      .eq('company_id', currentUser.company_id);

    if (dateFrom) {
      activityQuery = activityQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      activityQuery = activityQuery.lte('created_at', dateTo);
    }

    const { data: activities, error: activitiesError } = await activityQuery;

    if (activitiesError) {
      throw new Error(`Failed to get activities: ${activitiesError.message}`);
    }

    // Get pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, is_closed_won, is_closed_lost')
      .eq('company_id', currentUser.company_id);

    if (stagesError) {
      console.error('Pipeline stages error:', stagesError);
      // Continue with empty stages array
    }

    // Calculate performance for each user
    const userPerformance = users.map(user => {
      const userLeads = leads.filter(lead => lead.assigned_to === user.id);
      const userActivities = activities.filter(activity => activity.user_id === user.id);

      // Get won/lost leads based on pipeline stages
      let wonLeads = 0;
      let lostLeads = 0;

      userLeads.forEach(lead => {
        const stage = stages?.find(s => s.id === lead.pipeline_stage_id);
        if (stage?.is_closed_won) wonLeads++;
        if (stage?.is_closed_lost) lostLeads++;
      });

      const totalLeads = userLeads.length;
      const avgDealValue = userLeads.filter(lead => lead.deal_value).reduce((sum, lead) => sum + lead.deal_value, 0) / userLeads.filter(lead => lead.deal_value).length || 0;
      const totalDealValue = userLeads.filter(lead => lead.deal_value).reduce((sum, lead) => sum + lead.deal_value, 0);
      // Note: probability field doesn't exist in current schema, using 0 as default
      const avgProbability = 0;
      const totalActivities = userActivities.length;

      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        total_leads: totalLeads,
        won_leads: wonLeads,
        lost_leads: lostLeads,
        avg_deal_value: avgDealValue,
        total_deal_value: totalDealValue,
        avg_probability: avgProbability,
        total_activities: totalActivities,
        completed_activities: 0 // Simplified - would need completion data
      };
    });

    // Calculate team totals
    const teamTotals = userPerformance.reduce((totals, user) => {
      totals.totalLeads += user.total_leads;
      totals.wonLeads += user.won_leads;
      totals.lostLeads += user.lost_leads;
      totals.totalDealValue += user.total_deal_value;
      totals.totalActivities += user.total_activities;
      return totals;
    }, {
      totalLeads: 0,
      wonLeads: 0,
      lostLeads: 0,
      totalDealValue: 0,
      totalActivities: 0
    });

    // Calculate team averages
    const teamSize = userPerformance.length;
    const teamAverages = {
      avgLeadsPerUser: teamSize > 0 ? Math.round(teamTotals.totalLeads / teamSize) : 0,
      avgDealValuePerUser: teamSize > 0 ? Math.round(teamTotals.totalDealValue / teamSize) : 0,
      avgActivitiesPerUser: teamSize > 0 ? Math.round(teamTotals.totalActivities / teamSize) : 0,
      winRate: teamTotals.totalLeads > 0 ? Math.round((teamTotals.wonLeads / teamTotals.totalLeads) * 100) : 0
    };

    return {
      userPerformance,
      teamTotals,
      teamAverages,
      teamSize,
      filters: filters
    };
  } catch (error) {
    throw new Error(`Failed to get team performance metrics: ${error.message}`);
  }
};

/**
 * Get pipeline health analysis
 */
const getPipelineHealthAnalysis = async (currentUser, filters = {}) => {
  try {
    console.log('🔍 [PIPELINE SERVICE] Starting getPipelineHealthAnalysis...');
    console.log('🔍 [PIPELINE SERVICE] Current user:', currentUser?.email, 'Company ID:', currentUser?.company_id);
    console.log('🔍 [PIPELINE SERVICE] Filters:', filters);

    const supabase = supabaseAdmin;
    const { dateFrom, dateTo, userId } = filters;

    // Return empty data structure if no company to prevent errors
    if (!currentUser?.company_id) {
      console.log('⚠️ [PIPELINE SERVICE] No company_id found, returning empty data');
      return {
        stageHealth: [],
        velocityData: [],
        bottleneckData: [],
        filters: filters
      };
    }

    console.log('🔍 [PIPELINE SERVICE] Querying pipeline stages...');
    // Get pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('id, name, order_position')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .order('order_position', { ascending: true });

    if (stagesError) {
      console.error('❌ [PIPELINE SERVICE] Pipeline stages error:', stagesError);
      // Return empty data structure instead of throwing error
      return {
        stageHealth: [],
        velocityData: [],
        bottleneckData: [],
        filters: filters
      };
    }

    console.log('✅ [PIPELINE SERVICE] Pipeline stages retrieved:', stages?.length || 0, 'stages');

    // Get leads with filters
    let leadQuery = supabase
      .from('leads')
      .select('pipeline_stage_id, created_at, updated_at')
      .eq('company_id', currentUser.company_id);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      leadQuery = leadQuery.eq('assigned_to', currentUser.id);
    }

    if (dateFrom) {
      leadQuery = leadQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      leadQuery = leadQuery.lte('created_at', dateTo);
    }

    if (userId) {
      leadQuery = leadQuery.eq('assigned_to', userId);
    }

    console.log('🔍 [PIPELINE SERVICE] Querying leads...');
    const { data: leads, error: leadsError } = await leadQuery;

    if (leadsError) {
      console.error('❌ [PIPELINE SERVICE] Leads query error:', leadsError);
      throw new Error(`Failed to get leads: ${leadsError.message}`);
    }

    console.log('✅ [PIPELINE SERVICE] Leads retrieved:', leads?.length || 0, 'leads');

    // If no stages found, return empty data
    if (!stages || stages.length === 0) {
      return {
        stageHealth: [],
        velocityData: [],
        bottleneckData: [],
        filters: filters
      };
    }

    // Calculate stage health data with error handling
    let stageHealth = [];
    try {
      stageHealth = (stages || []).map(stage => {
        try {
          const stageLeads = (leads || []).filter(lead => lead && lead.pipeline_stage_id === stage.id);
          const leadCount = stageLeads.length;
          // Note: probability field doesn't exist in current schema, using 0 as default
          const avgProbability = 0;

          // Calculate average days in stage - handle invalid dates
          let avgDaysInStage = 0;
          try {
            if (stageLeads.length > 0) {
              const validLeads = stageLeads.filter(lead => lead.created_at);
              if (validLeads.length > 0) {
                const totalDays = validLeads.reduce((sum, lead) => {
                  try {
                    const createdDate = new Date(lead.created_at);
                    if (isNaN(createdDate.getTime())) return sum;
                    const daysInStage = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
                    return sum + (isNaN(daysInStage) ? 0 : Math.max(0, daysInStage));
                  } catch (e) {
                    return sum;
                  }
                }, 0);
                avgDaysInStage = totalDays / validLeads.length;
              }
            }
          } catch (e) {
            console.error('Error calculating avgDaysInStage:', e);
            avgDaysInStage = 0;
          }

          // Count stale leads (more than 30 days) - handle invalid dates
          let staleLeads = 0;
          try {
            staleLeads = stageLeads.filter(lead => {
              try {
                if (!lead.created_at) return false;
                const createdDate = new Date(lead.created_at);
                if (isNaN(createdDate.getTime())) return false;
                const daysInStage = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
                return !isNaN(daysInStage) && daysInStage > 30;
              } catch (e) {
                return false;
              }
            }).length;
          } catch (e) {
            console.error('Error calculating staleLeads:', e);
            staleLeads = 0;
          }

          return {
            stage_name: stage.name || 'Unknown Stage',
            order_position: stage.order_position || 0,
            lead_count: leadCount,
            avg_probability: Math.round((avgProbability || 0) * 100) / 100,
            avg_days_in_stage: Math.round((avgDaysInStage || 0) * 100) / 100,
            stale_leads: staleLeads
          };
        } catch (e) {
          console.error('Error processing stage health for stage:', stage, e);
          return {
            stage_name: stage?.name || 'Unknown Stage',
            order_position: stage?.order_position || 0,
            lead_count: 0,
            avg_probability: 0,
            avg_days_in_stage: 0,
            stale_leads: 0
          };
        }
      });
    } catch (e) {
      console.error('Error calculating stage health:', e);
      stageHealth = [];
    }

    // Calculate velocity data with error handling
    let velocityData = [];
    try {
      velocityData = (stages || []).map(stage => {
        try {
          const stageLeads = (leads || []).filter(lead =>
            lead &&
            lead.pipeline_stage_id === stage.id &&
            lead.updated_at &&
            lead.created_at &&
            lead.updated_at !== lead.created_at
          );
          const leadCount = stageLeads.length;

          // Calculate average time to move - handle invalid dates
          let avgTimeToMove = 0;
          try {
            if (stageLeads.length > 0) {
              const totalTime = stageLeads.reduce((sum, lead) => {
                try {
                  const updatedDate = new Date(lead.updated_at);
                  const createdDate = new Date(lead.created_at);
                  if (isNaN(updatedDate.getTime()) || isNaN(createdDate.getTime())) return sum;
                  const timeToMove = (updatedDate - createdDate) / (1000 * 60 * 60 * 24);
                  return sum + (isNaN(timeToMove) ? 0 : Math.max(0, timeToMove));
                } catch (e) {
                  return sum;
                }
              }, 0);
              avgTimeToMove = totalTime / stageLeads.length;
            }
          } catch (e) {
            console.error('Error calculating avgTimeToMove:', e);
            avgTimeToMove = 0;
          }

          // Count fast and slow moves - handle invalid dates
          let fastMoves = 0;
          let slowMoves = 0;
          try {
            fastMoves = stageLeads.filter(lead => {
              try {
                const updatedDate = new Date(lead.updated_at);
                const createdDate = new Date(lead.created_at);
                if (isNaN(updatedDate.getTime()) || isNaN(createdDate.getTime())) return false;
                const timeToMove = (updatedDate - createdDate) / (1000 * 60 * 60 * 24);
                return !isNaN(timeToMove) && timeToMove <= 7;
              } catch (e) {
                return false;
              }
            }).length;

            slowMoves = stageLeads.filter(lead => {
              try {
                const updatedDate = new Date(lead.updated_at);
                const createdDate = new Date(lead.created_at);
                if (isNaN(updatedDate.getTime()) || isNaN(createdDate.getTime())) return false;
                const timeToMove = (updatedDate - createdDate) / (1000 * 60 * 60 * 24);
                return !isNaN(timeToMove) && timeToMove > 30;
              } catch (e) {
                return false;
              }
            }).length;
          } catch (e) {
            console.error('Error calculating fast/slow moves:', e);
            fastMoves = 0;
            slowMoves = 0;
          }

          return {
            stage_name: stage.name || 'Unknown Stage',
            order_position: stage.order_position || 0,
            avg_time_to_move: Math.round((avgTimeToMove || 0) * 100) / 100,
            fast_moves: fastMoves,
            slow_moves: slowMoves
          };
        } catch (e) {
          console.error('Error processing velocity data for stage:', stage, e);
          return {
            stage_name: stage?.name || 'Unknown Stage',
            order_position: stage?.order_position || 0,
            avg_time_to_move: 0,
            fast_moves: 0,
            slow_moves: 0
          };
        }
      });
    } catch (e) {
      console.error('Error calculating velocity data:', e);
      velocityData = [];
    }

    // Calculate bottleneck data with error handling
    let bottleneckData = [];
    try {
      const totalLeads = (leads || []).length;
      bottleneckData = (stageHealth || [])
        .filter(stage => stage && stage.lead_count > 0)
        .map(stage => ({
          stage_name: stage.stage_name || 'Unknown Stage',
          order_position: stage.order_position || 0,
          lead_count: stage.lead_count || 0,
          percentage_of_total: totalLeads > 0 ? Math.round((stage.lead_count / totalLeads) * 100 * 100) / 100 : 0
        }))
        .sort((a, b) => (b.lead_count || 0) - (a.lead_count || 0));
    } catch (e) {
      console.error('Error calculating bottleneck data:', e);
      bottleneckData = [];
    }

    console.log('✅ [PIPELINE SERVICE] Pipeline health analysis completed successfully');
    return {
      stageHealth,
      velocityData,
      bottleneckData,
      filters: filters
    };
  } catch (error) {
    console.error('❌ [PIPELINE SERVICE] Error in getPipelineHealthAnalysis:', error);
    throw new Error(`Failed to get pipeline health analysis: ${error.message}`);
  }
};

/**
 * Generate custom report
 */
const generateCustomReport = async (currentUser, reportConfig) => {
  try {
    const { reportType, metrics, dimensions, filters, dateRange, groupBy, sortBy } = reportConfig;
    
    // For now, return a simplified response
    // In a full implementation, this would build dynamic queries based on the report configuration
    const result = {
      reportType,
      data: [], // Would contain actual report data
      config: reportConfig,
      generatedAt: new Date(),
      message: 'Custom report generation is simplified in this implementation'
    };

    return result;
  } catch (error) {
    throw new Error(`Failed to generate custom report: ${error.message}`);
  }
};

/**
 * Export report in various formats
 */
const exportReport = async (currentUser, exportConfig) => {
  try {
    const { type, reportType, data, format, filename } = exportConfig;
    
    let result;
    
    switch (type.toLowerCase()) {
      case 'csv':
        result = await reportGenerator.generateCSV(data, filename);
        break;
      case 'excel':
        result = await reportGenerator.generateExcel(data, filename);
        break;
      case 'pdf':
        result = await reportGenerator.generatePDF(data, reportType, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${type}`);
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to export report: ${error.message}`);
  }
};

/**
 * Get scheduled reports
 */
const getScheduledReports = async (currentUser, userId) => {
  try {
    // This would typically query a scheduled_reports table
    // For now, return empty array as this feature needs additional database setup
    return [];
  } catch (error) {
    throw new Error(`Failed to get scheduled reports: ${error.message}`);
  }
};

/**
 * Schedule recurring report
 */
const scheduleReport = async (currentUser, scheduleConfig) => {
  try {
    // This would typically insert into a scheduled_reports table
    // For now, return the config as if it was scheduled
    return {
      id: `scheduled_${Date.now()}`,
      ...scheduleConfig,
      createdAt: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to schedule report: ${error.message}`);
  }
};

/**
 * Get report templates
 */
const getReportTemplates = async () => {
  return [
    {
      id: 'lead_performance',
      name: 'Lead Performance Report',
      description: 'Comprehensive lead performance metrics and conversion rates',
      type: 'standard',
      category: 'leads'
    },
    {
      id: 'team_performance',
      name: 'Team Performance Report',
      description: 'Individual and team performance metrics',
      type: 'standard',
      category: 'team'
    },
    {
      id: 'pipeline_health',
      name: 'Pipeline Health Report',
      description: 'Pipeline analysis with bottlenecks and velocity metrics',
      type: 'standard',
      category: 'pipeline'
    },
    {
      id: 'activity_summary',
      name: 'Activity Summary Report',
      description: 'Activity tracking and communication analysis',
      type: 'standard',
      category: 'activities'
    }
  ];
};

/**
 * Get available metrics and dimensions for custom reports
 */
const getReportOptions = async () => {
  return {
    metrics: [
      { id: 'lead_count', name: 'Lead Count', type: 'count' },
      { id: 'deal_value', name: 'Deal Value', type: 'sum' },
      { id: 'avg_deal_value', name: 'Average Deal Value', type: 'avg' },
      { id: 'conversion_rate', name: 'Conversion Rate', type: 'percentage' },
      { id: 'activity_count', name: 'Activity Count', type: 'count' },
      { id: 'response_time', name: 'Response Time', type: 'avg' }
    ],
    dimensions: [
      { id: 'source', name: 'Lead Source', type: 'string' },
      { id: 'industry', name: 'Industry', type: 'string' },
      { id: 'pipeline_stage', name: 'Pipeline Stage', type: 'string' },
      { id: 'assigned_user', name: 'Assigned User', type: 'string' },
      { id: 'created_date', name: 'Created Date', type: 'date' },
      { id: 'activity_type', name: 'Activity Type', type: 'string' }
    ],
    filters: [
      { id: 'date_range', name: 'Date Range', type: 'date_range' },
      { id: 'user', name: 'User', type: 'user' },
      { id: 'pipeline_stage', name: 'Pipeline Stage', type: 'pipeline_stage' },
      { id: 'source', name: 'Lead Source', type: 'source' },
      { id: 'industry', name: 'Industry', type: 'industry' }
    ]
  };
};

// Helper functions for building custom report queries
const buildLeadsReportQuery = (metrics, dimensions, filters, dateRange, groupBy, sortBy) => {
  // Implementation for building leads report query
  return 'SELECT * FROM leads LIMIT 100'; // Placeholder
};

const buildActivitiesReportQuery = (metrics, dimensions, filters, dateRange, groupBy, sortBy) => {
  // Implementation for building activities report query
  return 'SELECT * FROM activities LIMIT 100'; // Placeholder
};

const buildPipelineReportQuery = (metrics, dimensions, filters, dateRange, groupBy, sortBy) => {
  // Implementation for building pipeline report query
  return 'SELECT * FROM leads l JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id LIMIT 100'; // Placeholder
};

module.exports = {
  getLeadPerformanceMetrics,
  getConversionFunnel,
  getActivitySummary,
  getTeamPerformanceMetrics,
  getPipelineHealthAnalysis,
  generateCustomReport,
  exportReport,
  getScheduledReports,
  scheduleReport,
  getReportTemplates,
  getReportOptions
};
