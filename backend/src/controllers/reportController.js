const reportService = require('../services/reportService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Get lead performance metrics
 */
const getLeadPerformance = async (req, res, next) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      userId, 
      pipelineStageId,
      source,
      industry 
    } = req.query;

    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      userId,
      pipelineStageId,
      source,
      industry
    };

    const metrics = await reportService.getLeadPerformanceMetrics(req.user, filters);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: 'lead_performance',
      companyId: req.user.company_id,
      details: { filters }
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(new ApiError('Failed to generate lead performance report', 500, error.message));
  }
};

/**
 * Get conversion funnel analysis
 */
const getConversionFunnel = async (req, res, next) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      userId 
    } = req.query;

    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      userId
    };

    const funnel = await reportService.getConversionFunnel(req.user, filters);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: 'conversion_funnel',
      companyId: req.user.company_id,
      details: { filters }
    });

    res.json({
      success: true,
      data: funnel
    });
  } catch (error) {
    next(new ApiError('Failed to generate conversion funnel report', 500, error.message));
  }
};

/**
 * Get activity summary reports
 */
const getActivitySummary = async (req, res, next) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      userId, 
      activityType,
      leadId 
    } = req.query;

    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      userId,
      activityType,
      leadId
    };

    const summary = await reportService.getActivitySummary(req.user, filters);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: 'activity_summary',
      companyId: req.user.company_id,
      details: { filters }
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(new ApiError('Failed to generate activity summary report', 500, error.message));
  }
};

/**
 * Get team performance metrics
 */
const getTeamPerformance = async (req, res, next) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      teamId 
    } = req.query;

    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      teamId
    };

    const performance = await reportService.getTeamPerformanceMetrics(req.user, filters);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: 'team_performance',
      companyId: req.user.company_id,
      details: { filters }
    });

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(new ApiError('Failed to generate team performance report', 500, error.message));
  }
};

/**
 * Get pipeline health analysis
 */
const getPipelineHealth = async (req, res, next) => {
  try {
    console.log('🔍 [PIPELINE HEALTH] Starting pipeline health analysis...');
    console.log('🔍 [PIPELINE HEALTH] User:', req.user?.email, 'Company:', req.user?.company_id);

    const {
      dateFrom,
      dateTo,
      userId
    } = req.query;

    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      userId
    };

    console.log('🔍 [PIPELINE HEALTH] Filters:', filters);

    const health = await reportService.getPipelineHealthAnalysis(req.user, filters);

    console.log('✅ [PIPELINE HEALTH] Analysis completed successfully');

    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: 'pipeline_health',
      companyId: req.user.company_id,
      details: { filters }
    });

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ [PIPELINE HEALTH] Error details:', {
      message: error.message,
      stack: error.stack,
      user: req.user?.email,
      company_id: req.user?.company_id,
      filters: req.query
    });
    next(new ApiError('Failed to generate pipeline health report', 500, error.message));
  }
};

/**
 * Generate custom report
 */
const generateCustomReport = async (req, res, next) => {
  try {
    const { 
      reportType,
      metrics,
      dimensions,
      filters,
      dateRange,
      groupBy,
      sortBy 
    } = req.body;

    const reportConfig = {
      reportType,
      metrics,
      dimensions,
      filters,
      dateRange,
      groupBy,
      sortBy
    };

    const report = await reportService.generateCustomReport(req.user, reportConfig);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: `custom_${reportConfig.reportType || 'custom'}`,
      companyId: req.user.company_id,
      details: {
        reportType: reportConfig.reportType,
        metrics: reportConfig.metrics,
        dimensions: reportConfig.dimensions,
        filters: reportConfig.filters
      }
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(new ApiError('Failed to generate custom report', 500, error.message));
  }
};

/**
 * Export report in various formats
 */
const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params; // pdf, excel, csv
    const { 
      reportType,
      data,
      format,
      filename 
    } = req.body;

    const exportConfig = {
      type,
      reportType,
      data,
      format,
      filename: filename || `${reportType}_${new Date().toISOString().split('T')[0]}`
    };

    const result = await reportService.exportReport(req.user, exportConfig);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_EXPORTED,
      resourceType: 'report',
      resourceName: exportConfig.reportType,
      companyId: req.user.company_id,
      details: {
        format: exportConfig.type,
        filename: result.filename
      }
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    next(new ApiError('Failed to export report', 500, error.message));
  }
};

/**
 * Get scheduled reports
 */
const getScheduledReports = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    const reports = await reportService.getScheduledReports(req.user, userId);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(new ApiError('Failed to get scheduled reports', 500, error.message));
  }
};

/**
 * Schedule recurring report
 */
const scheduleReport = async (req, res, next) => {
  try {
    const { 
      reportType,
      schedule,
      recipients,
      format,
      filters,
      name 
    } = req.body;

    const scheduleConfig = {
      reportType,
      schedule, // daily, weekly, monthly
      recipients,
      format,
      filters,
      name,
      createdBy: req.user.id
    };

    const scheduledReport = await reportService.scheduleReport(req.user, scheduleConfig);
    
    await logAuditEvent(req, {
      action: AuditActions.REPORT_SCHEDULED,
      resourceType: 'report_schedule',
      resourceId: scheduledReport.id,
      resourceName: scheduleConfig.name || scheduleConfig.reportType,
      companyId: req.user.company_id,
      details: {
        schedule: scheduleConfig.schedule,
        format: scheduleConfig.format,
        recipients: scheduleConfig.recipients
      }
    });

    res.json({
      success: true,
      data: scheduledReport
    });
  } catch (error) {
    next(new ApiError('Failed to schedule report', 500, error.message));
  }
};

/**
 * Get report templates
 */
const getReportTemplates = async (req, res, next) => {
  try {
    const templates = await reportService.getReportTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(new ApiError('Failed to get report templates', 500, error.message));
  }
};

/**
 * Get available metrics and dimensions for custom reports
 */
const getReportOptions = async (req, res, next) => {
  try {
    const options = await reportService.getReportOptions();
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    next(new ApiError('Failed to get report options', 500, error.message));
  }
};

module.exports = {
  getLeadPerformance,
  getConversionFunnel,
  getActivitySummary,
  getTeamPerformance,
  getPipelineHealth,
  generateCustomReport,
  exportReport,
  getScheduledReports,
  scheduleReport,
  getReportTemplates,
  getReportOptions
};
