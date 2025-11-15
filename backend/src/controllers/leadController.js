const { validationResult } = require('express-validator');
const leadService = require('../services/leadService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Lead Controller
 * Handles all lead-related operations (CRUD, search, stats)
 * Extends BaseController for standardized patterns
 */
class LeadController extends BaseController {
  /**
   * Build display name for a lead
   */
  buildLeadDisplayName(lead = {}) {
    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    return name || lead.name || lead.email || lead.company || `Lead ${lead.id}`;
  }

  /**
   * Compute changes between lead states
   */
  computeLeadChanges(before = {}, after = {}) {
    const trackedFields = [
      ['first_name', 'first_name'],
      ['last_name', 'last_name'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['company', 'company'],
      ['title', 'job_title'],
      ['source', 'lead_source'],
      ['status', 'status'],
      ['deal_value', 'deal_value'],
      ['expected_close_date', 'expected_close_date'],
      ['notes', 'notes'],
      ['priority', 'priority'],
      ['assigned_to', 'assigned_to'],
      ['pipeline_stage_id', 'pipeline_stage_id']
    ];

    return trackedFields.reduce((changes, [field, alias]) => {
      const beforeValue = before[field] ?? null;
      const afterValue = after[field] ?? null;

      if (beforeValue !== afterValue) {
        changes.push({
          field: alias,
          before: beforeValue,
          after: afterValue
        });
      }

      return changes;
    }, []);
  }

  /**
   * @desc    Get all leads with pagination, search, and filtering
   * @route   GET /api/leads
   * @access  Private
   */
  getLeads = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      source = '',
      assigned_to = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search,
      status,
      source,
      assigned_to,
      sort_by,
      sort_order
    };

    const result = await leadService.getLeads(
      req.user,
      parseInt(page),
      parseInt(limit),
      filters
    );

    const pagination = this.getPaginationMeta(
      result.totalItems,
      parseInt(page),
      parseInt(limit)
    );

    this.paginated(res, result.leads, pagination, 200, 'Leads retrieved successfully');
  });

  /**
   * @desc    Get lead by ID
   * @route   GET /api/leads/:id
   * @access  Private
   */
  getLeadById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return this.notFound(res, 'Lead not found');
    }

    this.success(res, lead, 200, 'Lead retrieved successfully');
  });

  /**
   * @desc    Create new lead
   * @route   POST /api/leads
   * @access  Private
   */
  createLead = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return this.validationError(res, 'Validation failed', errorMessages);
    }

    const leadData = {
      ...req.body,
      created_by: req.user.id,
      company_id: req.user.company_id
    };

    const lead = await leadService.createLead(leadData);

    await logAuditEvent(req, {
      action: AuditActions.LEAD_CREATED,
      resourceType: 'lead',
      resourceId: lead.id,
      resourceName: this.buildLeadDisplayName(lead),
      companyId: lead.company_id,
      details: {
        status: lead.status,
        source: lead.source,
        assigned_to: lead.assigned_to,
        pipeline_stage_id: lead.pipeline_stage_id
      },
      metadata: {
        created_by: lead.created_by
      }
    });

    this.created(res, lead, 'Lead created successfully');
  });

  /**
   * @desc    Update lead
   * @route   PUT /api/leads/:id
   * @access  Private
   */
  updateLead = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return this.validationError(res, 'Validation failed', errorMessages);
    }

    const { id } = req.params;
    const leadData = req.body;

    const leadResult = await leadService.updateLead(id, leadData, req.user);

    if (!leadResult) {
      return this.notFound(res, 'Lead not found');
    }

    const { updatedLead, previousLead } = leadResult;
    const changes = this.computeLeadChanges(previousLead, updatedLead);

    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.LEAD_UPDATED,
        resourceType: 'lead',
        resourceId: updatedLead.id,
        resourceName: this.buildLeadDisplayName(updatedLead),
        companyId: updatedLead.company_id,
        details: {
          changes
        }
      });

      const statusChange = changes.find(change => change.field === 'status');
      if (statusChange) {
        await logAuditEvent(req, {
          action: AuditActions.LEAD_STATUS_CHANGED,
          resourceType: 'lead',
          resourceId: updatedLead.id,
          resourceName: this.buildLeadDisplayName(updatedLead),
          companyId: updatedLead.company_id,
          severity: AuditSeverity.INFO,
          details: {
            from: statusChange.before,
            to: statusChange.after
          }
        });
      }

      const ownerChange = changes.find(change => change.field === 'assigned_to');
      if (ownerChange) {
        await logAuditEvent(req, {
          action: AuditActions.LEAD_OWNER_CHANGED,
          resourceType: 'lead',
          resourceId: updatedLead.id,
          resourceName: this.buildLeadDisplayName(updatedLead),
          companyId: updatedLead.company_id,
          severity: AuditSeverity.INFO,
          details: {
            from: ownerChange.before,
            to: ownerChange.after
          }
        });
      }
    }

    this.updated(res, updatedLead, 'Lead updated successfully');
  });

  /**
   * @desc    Delete lead
   * @route   DELETE /api/leads/:id
   * @access  Private
   */
  deleteLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await leadService.deleteLead(id, req.user);

    if (!result) {
      return this.notFound(res, 'Lead not found');
    }

    if (result.deletedLead) {
      await logAuditEvent(req, {
        action: AuditActions.LEAD_DELETED,
        resourceType: 'lead',
        resourceId: result.deletedLead.id,
        resourceName: this.buildLeadDisplayName(result.deletedLead),
        companyId: result.deletedLead.company_id,
        severity: AuditSeverity.WARNING,
        details: {
          assigned_to: result.deletedLead.assigned_to,
          status: result.deletedLead.status
        }
      });
    }

    this.deleted(res, 'Lead deleted successfully');
  });

  /**
   * @desc    Get lead statistics
   * @route   GET /api/leads/stats
   * @access  Private
   */
  getLeadStats = asyncHandler(async (req, res) => {
    const stats = await leadService.getLeadStats(req.user);
    this.success(res, stats, 200, 'Lead statistics retrieved successfully');
  });

  /**
   * @desc    Search leads
   * @route   GET /api/leads/search
   * @access  Private
   */
  searchLeads = asyncHandler(async (req, res) => {
    const { q: query, limit = 5 } = req.query;

    if (!query || query.trim().length < 2) {
      return this.validationError(res, 'Search query must be at least 2 characters long');
    }

    const results = await leadService.searchLeads(query, parseInt(limit));
    this.success(res, results, 200, 'Search completed successfully');
  });
}

module.exports = new LeadController();
