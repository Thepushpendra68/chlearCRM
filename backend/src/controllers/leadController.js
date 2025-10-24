const { validationResult } = require('express-validator');
const leadService = require('../services/leadService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

const buildLeadDisplayName = (lead = {}) => {
  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
  return name || lead.name || lead.email || lead.company || `Lead ${lead.id}`;
};

const computeLeadChanges = (before = {}, after = {}) => {
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
};

/**
 * @desc    Get all leads with pagination, search, and filtering
 * @route   GET /api/leads
 * @access  Private
 */
const getLeads = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      data: result.leads,
      pagination: {
        current_page: parseInt(page),
        total_pages: result.totalPages,
        total_items: result.totalItems,
        items_per_page: parseInt(limit),
        has_next: parseInt(page) < result.totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead by ID
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new lead
 * @route   POST /api/leads
 * @access  Private
 */
const createLead = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      // Create a more user-friendly error message
      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        error: {
          message: `Please check the following fields: ${fieldErrors}`,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const leadData = {
      ...req.body,
      created_by: req.user.id,
      company_id: req.user.company_id
    };

    // Pass industry config from middleware to service
    const lead = await leadService.createLead(leadData, req.industryConfig);

    await logAuditEvent(req, {
      action: AuditActions.LEAD_CREATED,
      resourceType: 'lead',
      resourceId: lead.id,
      resourceName: buildLeadDisplayName(lead),
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

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lead
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      // Create a more user-friendly error message
      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        error: {
          message: `Please check the following fields: ${fieldErrors}`,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { id } = req.params;
    const leadData = req.body;

    // Pass industry config from middleware to service
    const leadResult = await leadService.updateLead(id, leadData, req.user, req.industryConfig);

    if (!leadResult) {
      throw new ApiError('Lead not found', 404);
    }

    const { updatedLead, previousLead } = leadResult;
    const changes = computeLeadChanges(previousLead, updatedLead);

    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.LEAD_UPDATED,
        resourceType: 'lead',
        resourceId: updatedLead.id,
        resourceName: buildLeadDisplayName(updatedLead),
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
          resourceName: buildLeadDisplayName(updatedLead),
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
          resourceName: buildLeadDisplayName(updatedLead),
          companyId: updatedLead.company_id,
          severity: AuditSeverity.INFO,
          details: {
            from: ownerChange.before,
            to: ownerChange.after
          }
        });
      }
    }

    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete lead
 * @route   DELETE /api/leads/:id
 * @access  Private
 */
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await leadService.deleteLead(id, req.user);

    if (!result) {
      throw new ApiError('Lead not found', 404);
    }

    if (result.deletedLead) {
      await logAuditEvent(req, {
        action: AuditActions.LEAD_DELETED,
        resourceType: 'lead',
        resourceId: result.deletedLead.id,
        resourceName: buildLeadDisplayName(result.deletedLead),
        companyId: result.deletedLead.company_id,
        severity: AuditSeverity.WARNING,
        details: {
          assigned_to: result.deletedLead.assigned_to,
          status: result.deletedLead.status
        }
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead statistics
 * @route   GET /api/leads/stats
 * @access  Private
 */
const getLeadStats = async (req, res, next) => {
  try {
    const stats = await leadService.getLeadStats(req.user);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search leads
 * @route   GET /api/leads/search
 * @access  Private
 */
const searchLeads = async (req, res, next) => {
  try {
    const { q: query, limit = 5 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query must be at least 2 characters long'
        }
      });
    }

    const results = await leadService.searchLeads(query, parseInt(limit));
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  searchLeads
};
