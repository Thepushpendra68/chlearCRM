const knex = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (currentUser) => {
  try {
    let baseQuery = knex('leads');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      baseQuery = baseQuery.where('assigned_to', currentUser.id);
    }

    // Total leads
    const [{ total_leads }] = await baseQuery.clone().count('* as total_leads');

    // New leads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [{ new_leads }] = await baseQuery.clone()
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as new_leads');

    // Converted leads
    const [{ converted_leads }] = await baseQuery.clone()
      .where('status', 'converted')
      .count('* as converted_leads');

    // Calculate conversion rate
    const totalLeadsCount = parseInt(total_leads);
    const convertedLeadsCount = parseInt(converted_leads);
    const conversionRate = totalLeadsCount > 0 ? (convertedLeadsCount / totalLeadsCount * 100).toFixed(1) : '0.0';

    return {
      total_leads: totalLeadsCount,
      new_leads: parseInt(new_leads),
      converted_leads: convertedLeadsCount,
      conversion_rate: `${conversionRate}%`
    };
  } catch (error) {
    throw new ApiError('Failed to fetch dashboard statistics', 500);
  }
};

/**
 * Get recent leads
 */
const getRecentLeads = async (currentUser, limit = 10) => {
  try {
    let query = knex('leads')
      .leftJoin('users', 'leads.assigned_to', 'users.id')
      .select(
        'leads.id',
        'leads.first_name',
        'leads.last_name',
        'leads.email',
        'leads.company',
        'leads.status',
        'leads.lead_source',
        'leads.created_at',
        'users.first_name as assigned_user_first_name',
        'users.last_name as assigned_user_last_name'
      )
      .orderBy('leads.created_at', 'desc')
      .limit(limit);

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('leads.assigned_to', currentUser.id);
    }

    return await query;
  } catch (error) {
    throw new ApiError('Failed to fetch recent leads', 500);
  }
};

/**
 * Get lead trends over time
 */
const getLeadTrends = async (currentUser, period = '30d') => {
  try {
    let dateFilter;
    let groupByFormat;

    // Determine date range and grouping format
    switch (period) {
      case '7d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '30d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '90d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 90);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case '1y':
        dateFilter = new Date();
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        groupByFormat = 'YYYY-MM';
        break;
      default:
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
        groupByFormat = 'YYYY-MM-DD';
    }

    let query = knex('leads')
      .select(
        knex.raw(`DATE_TRUNC('day', created_at) as date`),
        knex.raw('COUNT(*) as count')
      )
      .where('created_at', '>=', dateFilter)
      .groupBy(knex.raw('DATE_TRUNC(\'day\', created_at)'))
      .orderBy('date', 'asc');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('assigned_to', currentUser.id);
    }

    const trends = await query;

    // Format the data for charts
    return trends.map(trend => ({
      date: trend.date.toISOString().split('T')[0],
      count: parseInt(trend.count)
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch lead trends', 500);
  }
};

/**
 * Get lead source distribution
 */
const getLeadSources = async (currentUser) => {
  try {
    let query = knex('leads')
      .select('lead_source')
      .count('* as count')
      .groupBy('lead_source')
      .orderBy('count', 'desc');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('assigned_to', currentUser.id);
    }

    const sources = await query;

    // Calculate percentages
    const total = sources.reduce((sum, source) => sum + parseInt(source.count), 0);
    
    return sources.map(source => ({
      source: source.lead_source,
      count: parseInt(source.count),
      percentage: total > 0 ? ((parseInt(source.count) / total) * 100).toFixed(1) : '0.0'
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch lead sources', 500);
  }
};

/**
 * Get lead status distribution
 */
const getLeadStatus = async (currentUser) => {
  try {
    let query = knex('leads')
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('count', 'desc');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('assigned_to', currentUser.id);
    }

    const statuses = await query;

    // Calculate percentages
    const total = statuses.reduce((sum, status) => sum + parseInt(status.count), 0);
    
    return statuses.map(status => ({
      status: status.status,
      count: parseInt(status.count),
      percentage: total > 0 ? ((parseInt(status.count) / total) * 100).toFixed(1) : '0.0'
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch lead status', 500);
  }
};

/**
 * Get user performance metrics (admin only)
 */
const getUserPerformance = async () => {
  try {
    const performance = await knex('users')
      .leftJoin('leads', 'users.id', 'leads.assigned_to')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.role',
        knex.raw('COUNT(leads.id) as total_leads'),
        knex.raw('COUNT(CASE WHEN leads.status = \'converted\' THEN 1 END) as converted_leads'),
        knex.raw('COUNT(CASE WHEN leads.created_at >= NOW() - INTERVAL \'30 days\' THEN 1 END) as recent_leads')
      )
      .where('users.is_active', true)
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.role')
      .orderBy('total_leads', 'desc');

    return performance.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      total_leads: parseInt(user.total_leads),
      converted_leads: parseInt(user.converted_leads),
      recent_leads: parseInt(user.recent_leads),
      conversion_rate: user.total_leads > 0 ? 
        ((parseInt(user.converted_leads) / parseInt(user.total_leads)) * 100).toFixed(1) : '0.0'
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch user performance', 500);
  }
};

/**
 * Get monthly lead trends for the past 12 months
 */
const getMonthlyTrends = async (currentUser) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    let query = knex('leads')
      .select(
        knex.raw('DATE_TRUNC(\'month\', created_at) as month'),
        knex.raw('COUNT(*) as count')
      )
      .where('created_at', '>=', twelveMonthsAgo)
      .groupBy(knex.raw('DATE_TRUNC(\'month\', created_at)'))
      .orderBy('month', 'asc');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('assigned_to', currentUser.id);
    }

    const trends = await query;

    return trends.map(trend => ({
      month: trend.month.toISOString().substring(0, 7), // YYYY-MM format
      count: parseInt(trend.count)
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch monthly trends', 500);
  }
};

/**
 * Get pipeline stage distribution
 */
const getPipelineStageDistribution = async (currentUser) => {
  try {
    let query = knex('leads')
      .leftJoin('pipeline_stages', 'leads.pipeline_stage_id', 'pipeline_stages.id')
      .select(
        'pipeline_stages.name as stage_name',
        'pipeline_stages.order_position',
        knex.raw('COUNT(leads.id) as count'),
        knex.raw('AVG(leads.deal_value) as avg_deal_value'),
        knex.raw('SUM(leads.deal_value) as total_deal_value')
      )
      .groupBy('pipeline_stages.id', 'pipeline_stages.name', 'pipeline_stages.order_position')
      .orderBy('pipeline_stages.order_position', 'asc');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('leads.assigned_to', currentUser.id);
    }

    const stages = await query;

    // Calculate percentages
    const total = stages.reduce((sum, stage) => sum + parseInt(stage.count), 0);
    
    return stages.map(stage => ({
      stage_name: stage.stage_name,
      order_position: stage.order_position,
      count: parseInt(stage.count),
      percentage: total > 0 ? ((parseInt(stage.count) / total) * 100).toFixed(1) : '0.0',
      avg_deal_value: parseFloat(stage.avg_deal_value || 0),
      total_deal_value: parseFloat(stage.total_deal_value || 0)
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch pipeline stage distribution', 500);
  }
};

/**
 * Get activity trends over time
 */
const getActivityTrends = async (currentUser, period = '30d') => {
  try {
    let dateFilter;
    
    // Determine date range
    switch (period) {
      case '7d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    let query = knex('activities')
      .select(
        knex.raw('DATE_TRUNC(\'day\', created_at) as date'),
        'activity_type',
        knex.raw('COUNT(*) as count')
      )
      .where('created_at', '>=', dateFilter)
      .groupBy(knex.raw('DATE_TRUNC(\'day\', created_at)'), 'activity_type')
      .orderBy('date', 'asc');

    // Non-admin users only see their activities
    if (currentUser.role !== 'admin') {
      query = query.where('user_id', currentUser.id);
    }

    const trends = await query;

    // Group by date and activity type
    const groupedTrends = {};
    trends.forEach(trend => {
      const date = trend.date.toISOString().split('T')[0];
      if (!groupedTrends[date]) {
        groupedTrends[date] = {};
      }
      groupedTrends[date][trend.activity_type] = parseInt(trend.count);
    });

    return groupedTrends;
  } catch (error) {
    throw new ApiError('Failed to fetch activity trends', 500);
  }
};

/**
 * Get conversion funnel data
 */
const getConversionFunnelData = async (currentUser) => {
  try {
    let query = knex('leads')
      .leftJoin('pipeline_stages', 'leads.pipeline_stage_id', 'pipeline_stages.id')
      .select(
        'pipeline_stages.name as stage_name',
        'pipeline_stages.order_position',
        knex.raw('COUNT(leads.id) as count')
      )
      .groupBy('pipeline_stages.id', 'pipeline_stages.name', 'pipeline_stages.order_position')
      .orderBy('pipeline_stages.order_position', 'asc');

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('leads.assigned_to', currentUser.id);
    }

    const stages = await query;

    // Calculate conversion rates
    const funnelData = [];
    let previousCount = null;

    stages.forEach(stage => {
      const count = parseInt(stage.count);
      const conversionRate = previousCount && previousCount > 0 ? 
        ((count / previousCount) * 100).toFixed(1) : '100.0';
      
      funnelData.push({
        stage_name: stage.stage_name,
        order_position: stage.order_position,
        count: count,
        conversion_rate: parseFloat(conversionRate)
      });
      
      previousCount = count;
    });

    return funnelData;
  } catch (error) {
    throw new ApiError('Failed to fetch conversion funnel data', 500);
  }
};

/**
 * Get response time analytics
 */
const getResponseTimeAnalytics = async (currentUser) => {
  try {
    let query = knex('leads')
      .leftJoin('activities', function() {
        this.on('leads.id', '=', 'activities.lead_id')
             .andOn('activities.activity_type', '=', knex.raw('?', ['call']))
             .andOn('activities.created_at', '>', 'leads.created_at');
      })
      .select(
        knex.raw('AVG(EXTRACT(EPOCH FROM (activities.created_at - leads.created_at))/3600) as avg_response_time_hours'),
        knex.raw('COUNT(CASE WHEN EXTRACT(EPOCH FROM (activities.created_at - leads.created_at))/3600 <= 1 THEN 1 END) as responded_within_1h'),
        knex.raw('COUNT(CASE WHEN EXTRACT(EPOCH FROM (activities.created_at - leads.created_at))/3600 <= 24 THEN 1 END) as responded_within_24h'),
        knex.raw('COUNT(leads.id) as total_leads')
      );

    // Non-admin users only see their assigned leads
    if (currentUser.role !== 'admin') {
      query = query.where('leads.assigned_to', currentUser.id);
    }

    const [result] = await query;

    const totalLeads = parseInt(result.total_leads) || 0;
    const respondedWithin1h = parseInt(result.responded_within_1h) || 0;
    const respondedWithin24h = parseInt(result.responded_within_24h) || 0;

    return {
      avg_response_time_hours: parseFloat(result.avg_response_time_hours || 0),
      responded_within_1h: respondedWithin1h,
      responded_within_24h: respondedWithin24h,
      response_rate_1h: totalLeads > 0 ? ((respondedWithin1h / totalLeads) * 100).toFixed(1) : '0.0',
      response_rate_24h: totalLeads > 0 ? ((respondedWithin24h / totalLeads) * 100).toFixed(1) : '0.0',
      total_leads: totalLeads
    };
  } catch (error) {
    throw new ApiError('Failed to fetch response time analytics', 500);
  }
};

/**
 * Get team workload distribution
 */
const getTeamWorkloadDistribution = async () => {
  try {
    const workload = await knex('users')
      .leftJoin('leads', 'users.id', 'leads.assigned_to')
      .leftJoin('activities', 'users.id', 'activities.user_id')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        knex.raw('COUNT(DISTINCT leads.id) as total_leads'),
        knex.raw('COUNT(DISTINCT CASE WHEN leads.pipeline_stage_id IS NOT NULL THEN leads.id END) as active_leads'),
        knex.raw('COUNT(activities.id) as total_activities'),
        knex.raw('COUNT(CASE WHEN activities.created_at >= NOW() - INTERVAL \'7 days\' THEN activities.id END) as recent_activities')
      )
      .where('users.is_active', true)
      .where('users.role', '!=', 'admin')
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('total_leads', 'desc');

    return workload.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      total_leads: parseInt(user.total_leads),
      active_leads: parseInt(user.active_leads),
      total_activities: parseInt(user.total_activities),
      recent_activities: parseInt(user.recent_activities)
    }));
  } catch (error) {
    throw new ApiError('Failed to fetch team workload distribution', 500);
  }
};

module.exports = {
  getDashboardStats,
  getRecentLeads,
  getLeadTrends,
  getLeadSources,
  getLeadStatus,
  getUserPerformance,
  getMonthlyTrends,
  getPipelineStageDistribution,
  getActivityTrends,
  getConversionFunnelData,
  getResponseTimeAnalytics,
  getTeamWorkloadDistribution
};
