const db = require('../config/database');
const reportGenerator = require('../utils/reportGenerator');

/**
 * Get lead performance metrics
 */
const getLeadPerformanceMetrics = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, userId, pipelineStageId, source, industry } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereClause += ` AND l.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND l.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND l.assigned_to = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (pipelineStageId) {
      whereClause += ` AND l.pipeline_stage_id = $${paramIndex}`;
      params.push(pipelineStageId);
      paramIndex++;
    }

    if (source) {
      whereClause += ` AND l.lead_source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    // Note: industry field doesn't exist in current schema
    // if (industry) {
    //   whereClause += ` AND l.industry = $${paramIndex}`;
    //   params.push(industry);
    //   paramIndex++;
    // }

    // Get basic lead metrics
    const leadMetricsQuery = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN ps.is_won = true THEN 1 END) as won_leads,
        COUNT(CASE WHEN ps.is_lost = true THEN 1 END) as lost_leads,
        COUNT(CASE WHEN l.pipeline_stage_id IS NOT NULL THEN 1 END) as active_leads,
        AVG(l.deal_value) as avg_deal_value,
        SUM(l.deal_value) as total_deal_value,
        AVG(l.probability) as avg_probability
      FROM leads l
      LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
      ${whereClause}
    `;

    const leadMetrics = await db.raw(leadMetricsQuery, params);

    // Get conversion rates by stage
    let conversionWhereClause = '';
    if (whereClause !== 'WHERE 1=1') {
      conversionWhereClause = whereClause.replace('WHERE 1=1', 'AND');
    }
    const conversionQuery = `
      SELECT 
        ps.name as stage_name,
        ps.order_position,
        COUNT(l.id) as lead_count,
        AVG(l.probability) as avg_probability,
        SUM(l.deal_value) as total_value
      FROM pipeline_stages ps
      LEFT JOIN leads l ON ps.id = l.pipeline_stage_id ${conversionWhereClause}
      WHERE ps.is_active = true
      GROUP BY ps.id, ps.name, ps.order_position
      ORDER BY ps.order_position
    `;

    const conversionData = await db.raw(conversionQuery, params);

    // Get response time metrics
    const responseTimeQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (a.created_at - l.created_at))/3600) as avg_response_time_hours,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (a.created_at - l.created_at))/3600 <= 24 THEN 1 END) as responded_within_24h,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (a.created_at - l.created_at))/3600 <= 1 THEN 1 END) as responded_within_1h
      FROM leads l
      LEFT JOIN activities a ON l.id = a.lead_id AND a.activity_type = 'call'
      ${whereClause}
    `;

    const responseTime = await db.raw(responseTimeQuery, params);

    return {
      leadMetrics: leadMetrics.rows[0],
      conversionData: conversionData.rows,
      responseTime: responseTime.rows[0],
      filters: filters
    };
  } catch (error) {
    throw new Error(`Failed to get lead performance metrics: ${error.message}`);
  }
};

/**
 * Get conversion funnel analysis
 */
const getConversionFunnel = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, userId } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereClause += ` AND l.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND l.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND l.assigned_to = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    let funnelWhereClause = '';
    if (whereClause !== 'WHERE 1=1') {
      funnelWhereClause = whereClause.replace('WHERE 1=1', 'AND');
    }
    const funnelQuery = `
      WITH stage_progression AS (
        SELECT 
          ps.name as stage_name,
          ps.order_position,
          COUNT(l.id) as lead_count,
          LAG(COUNT(l.id)) OVER (ORDER BY ps.order_position) as previous_stage_count
        FROM pipeline_stages ps
        LEFT JOIN leads l ON ps.id = l.pipeline_stage_id ${funnelWhereClause}
        WHERE ps.is_active = true
        GROUP BY ps.id, ps.name, ps.order_position
      )
      SELECT 
        stage_name,
        order_position,
        lead_count,
        previous_stage_count,
        CASE 
          WHEN previous_stage_count > 0 THEN 
            ROUND((lead_count::DECIMAL / previous_stage_count) * 100, 2)
          ELSE 100
        END as conversion_rate
      FROM stage_progression
      ORDER BY order_position
    `;

    const funnelData = await db.raw(funnelQuery, params);

    // Calculate overall conversion rate
    const totalLeads = funnelData.rows.reduce((sum, stage) => sum + parseInt(stage.lead_count), 0);
    const wonLeads = funnelData.rows.find(stage => stage.stage_name.toLowerCase().includes('won'))?.lead_count || 0;
    const overallConversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    return {
      funnelData: funnelData.rows,
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
const getActivitySummary = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, userId, activityType, leadId } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereClause += ` AND a.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND a.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND a.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (activityType) {
      whereClause += ` AND a.activity_type = $${paramIndex}`;
      params.push(activityType);
      paramIndex++;
    }

    if (leadId) {
      whereClause += ` AND a.lead_id = $${paramIndex}`;
      params.push(leadId);
      paramIndex++;
    }

    // Get activity summary by type
    const activitySummaryQuery = `
      SELECT 
        a.activity_type,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN a.is_completed = true THEN 1 END) as completed_activities,
        AVG(a.duration_minutes) as avg_duration_minutes,
        COUNT(DISTINCT a.lead_id) as unique_leads_contacted,
        COUNT(DISTINCT a.user_id) as unique_users
      FROM activities a
      ${whereClause}
      GROUP BY a.activity_type
      ORDER BY total_activities DESC
    `;

    const activitySummary = await db.raw(activitySummaryQuery, params);

    // Get daily activity trends
    const dailyTrendsQuery = `
      SELECT 
        DATE(a.created_at) as activity_date,
        a.activity_type,
        COUNT(*) as activity_count
      FROM activities a
      ${whereClause}
      GROUP BY DATE(a.created_at), a.activity_type
      ORDER BY activity_date DESC, activity_type
      LIMIT 30
    `;

    const dailyTrends = await db.raw(dailyTrendsQuery, params);

    // Get outcome analysis
    const outcomeQuery = `
      SELECT 
        a.outcome,
        COUNT(*) as count,
        a.activity_type
      FROM activities a
      ${whereClause} AND a.outcome IS NOT NULL
      GROUP BY a.outcome, a.activity_type
      ORDER BY count DESC
    `;

    const outcomeAnalysis = await db.raw(outcomeQuery, params);

    return {
      activitySummary: activitySummary.rows,
      dailyTrends: dailyTrends.rows,
      outcomeAnalysis: outcomeAnalysis.rows,
      filters: filters
    };
  } catch (error) {
    throw new Error(`Failed to get activity summary: ${error.message}`);
  }
};

/**
 * Get team performance metrics
 */
const getTeamPerformanceMetrics = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, teamId } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereClause += ` AND l.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND l.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Get individual user performance
    let userWhereClause = '';
    if (whereClause !== 'WHERE 1=1') {
      userWhereClause = whereClause.replace('WHERE 1=1', 'AND');
    }
    const userPerformanceQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN ps.is_won = true THEN 1 END) as won_leads,
        COUNT(CASE WHEN ps.is_lost = true THEN 1 END) as lost_leads,
        AVG(l.deal_value) as avg_deal_value,
        SUM(l.deal_value) as total_deal_value,
        AVG(l.probability) as avg_probability,
        COUNT(a.id) as total_activities,
        COUNT(CASE WHEN a.is_completed = true THEN 1 END) as completed_activities
      FROM users u
      LEFT JOIN leads l ON u.id = l.assigned_to ${userWhereClause}
      LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
      LEFT JOIN activities a ON u.id = a.user_id 
        AND (${dateFrom ? `a.created_at >= $${paramIndex}` : '1=1'})
        AND (${dateTo ? `a.created_at <= $${paramIndex + (dateFrom ? 1 : 0)}` : '1=1'})
      WHERE u.role != 'admin'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY total_deal_value DESC
    `;

    const userPerformance = await db.raw(userPerformanceQuery, params);

    // Calculate team totals
    const teamTotals = userPerformance.rows.reduce((totals, user) => {
      totals.totalLeads += parseInt(user.total_leads) || 0;
      totals.wonLeads += parseInt(user.won_leads) || 0;
      totals.lostLeads += parseInt(user.lost_leads) || 0;
      totals.totalDealValue += parseFloat(user.total_deal_value) || 0;
      totals.totalActivities += parseInt(user.total_activities) || 0;
      return totals;
    }, {
      totalLeads: 0,
      wonLeads: 0,
      lostLeads: 0,
      totalDealValue: 0,
      totalActivities: 0
    });

    // Calculate team averages
    const teamSize = userPerformance.rows.length;
    const teamAverages = {
      avgLeadsPerUser: teamSize > 0 ? Math.round(teamTotals.totalLeads / teamSize) : 0,
      avgDealValuePerUser: teamSize > 0 ? Math.round(teamTotals.totalDealValue / teamSize) : 0,
      avgActivitiesPerUser: teamSize > 0 ? Math.round(teamTotals.totalActivities / teamSize) : 0,
      winRate: teamTotals.totalLeads > 0 ? Math.round((teamTotals.wonLeads / teamTotals.totalLeads) * 100) : 0
    };

    return {
      userPerformance: userPerformance.rows,
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
const getPipelineHealthAnalysis = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, userId } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereClause += ` AND l.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND l.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND l.assigned_to = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Get stage distribution and health
    let stageWhereClause = '';
    if (whereClause !== 'WHERE 1=1') {
      stageWhereClause = whereClause.replace('WHERE 1=1', 'AND');
    }
    const stageHealthQuery = `
      SELECT 
        ps.name as stage_name,
        ps.order_position,
        COUNT(l.id) as lead_count,
        AVG(l.probability) as avg_probability,
        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - l.created_at))/86400) as avg_days_in_stage,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - l.created_at))/86400 > 30 THEN 1 END) as stale_leads
      FROM pipeline_stages ps
      LEFT JOIN leads l ON ps.id = l.pipeline_stage_id ${stageWhereClause}
      WHERE ps.is_active = true
      GROUP BY ps.id, ps.name, ps.order_position
      ORDER BY ps.order_position
    `;

    const stageHealth = await db.raw(stageHealthQuery, params);

    // Get velocity metrics
    const velocityQuery = `
      SELECT 
        ps.name as stage_name,
        ps.order_position,
        AVG(EXTRACT(EPOCH FROM (l.updated_at - l.created_at))/86400) as avg_time_to_move,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (l.updated_at - l.created_at))/86400 <= 7 THEN 1 END) as fast_moves,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (l.updated_at - l.created_at))/86400 > 30 THEN 1 END) as slow_moves
      FROM pipeline_stages ps
      LEFT JOIN leads l ON ps.id = l.pipeline_stage_id ${stageWhereClause}
      WHERE ps.is_active = true AND l.updated_at != l.created_at
      GROUP BY ps.id, ps.name, ps.order_position
      ORDER BY ps.order_position
    `;

    const velocityData = await db.raw(velocityQuery, params);

    // Get bottleneck analysis
    const bottleneckQuery = `
      SELECT 
        ps.name as stage_name,
        ps.order_position,
        COUNT(l.id) as lead_count,
        ROUND((COUNT(l.id)::DECIMAL / (SELECT COUNT(*) FROM leads ${whereClause})) * 100, 2) as percentage_of_total
      FROM pipeline_stages ps
      LEFT JOIN leads l ON ps.id = l.pipeline_stage_id ${stageWhereClause}
      WHERE ps.is_active = true
      GROUP BY ps.id, ps.name, ps.order_position
      HAVING COUNT(l.id) > 0
      ORDER BY lead_count DESC
    `;

    const bottleneckData = await db.raw(bottleneckQuery, params);

    return {
      stageHealth: stageHealth.rows,
      velocityData: velocityData.rows,
      bottleneckData: bottleneckData.rows,
      filters: filters
    };
  } catch (error) {
    throw new Error(`Failed to get pipeline health analysis: ${error.message}`);
  }
};

/**
 * Generate custom report
 */
const generateCustomReport = async (reportConfig) => {
  try {
    const { reportType, metrics, dimensions, filters, dateRange, groupBy, sortBy } = reportConfig;
    
    // Build dynamic query based on report configuration
    let query = '';
    let params = [];
    
    switch (reportType) {
      case 'leads':
        query = buildLeadsReportQuery(metrics, dimensions, filters, dateRange, groupBy, sortBy);
        break;
      case 'activities':
        query = buildActivitiesReportQuery(metrics, dimensions, filters, dateRange, groupBy, sortBy);
        break;
      case 'pipeline':
        query = buildPipelineReportQuery(metrics, dimensions, filters, dateRange, groupBy, sortBy);
        break;
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    const result = await db.raw(query, params);
    
    return {
      reportType,
      data: result.rows,
      config: reportConfig,
      generatedAt: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to generate custom report: ${error.message}`);
  }
};

/**
 * Export report in various formats
 */
const exportReport = async (exportConfig) => {
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
const getScheduledReports = async (userId) => {
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
const scheduleReport = async (scheduleConfig) => {
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
