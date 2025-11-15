const reportService = require('../services/reportService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Report Controller
 * Handles all reporting and analytics operations
 * Extends BaseController for standardized patterns
 */
class ReportController extends BaseController {
  /**
   * Describe report for logging
   */
  describeReport(report = {}) {
    return report?.name || `Report ${report?.id || ''}`.trim();
  }

  /**
   * Get lead performance metrics
   */
  getLeadPerformance = asyncHandler(async (req, res) => {
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

    this.success(res, metrics, 200, 'Lead performance report generated successfully');
  });

  /**
   * Get conversion funnel analysis
   */
  getConversionFunnel = asyncHandler(async (req, res) => {
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

    this.success(res, funnel, 200, 'Conversion funnel report generated successfully');
  });

  /**
   * Get activity summary reports
   */
  getActivitySummary = asyncHandler(async (req, res) => {
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

    this.success(res, summary, 200, 'Activity summary report generated successfully');
  });

  /**
   * Get team performance metrics
   */
  getTeamPerformance = asyncHandler(async (req, res) => {
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

    this.success(res, performance, 200, 'Team performance report generated successfully');
  });

  /**
   * Get pipeline health analysis
   */
  getPipelineHealth = asyncHandler(async (req, res) => {
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

    const health = await reportService.getPipelineHealthAnalysis(req.user, filters);

    await logAuditEvent(req, {
      action: AuditActions.REPORT_GENERATED,
      resourceType: 'report',
      resourceName: 'pipeline_health',
      companyId: req.user.company_id,
      details: { filters }
    });

    this.success(res, health, 200, 'Pipeline health report generated successfully');
  });

  /**
   * Generate custom report
   */
  generateCustomReport = asyncHandler(async (req, res) => {
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

    this.success(res, report, 200, 'Custom report generated successfully');
  });

  /**
   * Export report in various formats
   */
  exportReport = asyncHandler(async (req, res) => {
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
  });

  /**
   * Get scheduled reports
   */
  getScheduledReports = asyncHandler(async (req, res) => {
    const { userId } = req.query;

    const reports = await reportService.getScheduledReports(req.user, userId);

    this.success(res, reports, 200, 'Scheduled reports retrieved successfully');
  });

  /**
   * Schedule recurring report
   */
  scheduleReport = asyncHandler(async (req, res) => {
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

    this.created(res, scheduledReport, 'Report scheduled successfully');
  });

  /**
   * Get report templates
   */
  getReportTemplates = asyncHandler(async (req, res) => {
    const templates = await reportService.getReportTemplates();

    this.success(res, templates, 200, 'Report templates retrieved successfully');
  });

  /**
   * Get available metrics and dimensions for custom reports
   */
  getReportOptions = asyncHandler(async (req, res) => {
    const options = await reportService.getReportOptions();

    this.success(res, options, 200, 'Report options retrieved successfully');
  });
}

module.exports = new ReportController();
