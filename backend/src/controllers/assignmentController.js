const assignmentService = require('../services/assignmentService');
const routingService = require('../services/routingService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Assignment Controller
 * Handles all lead assignment and routing operations
 * Extends BaseController for standardized patterns
 */
class AssignmentController extends BaseController {
  /**
   * Summarize rule for logging
   */
  summarizeRule(rule = {}) {
    return rule?.name || `Rule ${rule?.id || ''}`.trim();
  }

  /**
   * Compute changes between rule states
   */
  computeRuleChanges(before = {}, after = {}) {
    const fields = [
      'name',
      'assignment_type',
      'assigned_to',
      'is_active',
      'priority'
    ];

    const changes = fields.reduce((acc, field) => {
      const beforeVal = before[field] ?? null;
      const afterVal = after[field] ?? null;
      if (beforeVal !== afterVal) {
        acc.push({ field, before: beforeVal, after: afterVal });
      }
      return acc;
    }, []);

    if (JSON.stringify(before.conditions || null) !== JSON.stringify(after.conditions || null)) {
      changes.push({
        field: 'conditions',
        before: before.conditions || null,
        after: after.conditions || null
      });
    }

    return changes;
  }
  // Get all assignment rules
  getRules = asyncHandler(async (req, res) => {
    const result = await assignmentService.getAllRules(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Assignment rules retrieved successfully');
  });

  // Get active assignment rules
  getActiveRules = asyncHandler(async (req, res) => {
    const result = await assignmentService.getActiveRules(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Active assignment rules retrieved successfully');
  });

  // Get assignment rule by ID
  getRuleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await assignmentService.getRuleById(id, req.user);

    if (!result.success) {
      return this.notFound(res, result.error);
    }

    this.success(res, result.data, 200, 'Assignment rule retrieved successfully');
  });

  // Create new assignment rule
  createRule = asyncHandler(async (req, res) => {
    const ruleData = req.body;
    const result = await assignmentService.createRule(ruleData, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.ASSIGNMENT_CREATED,
      resourceType: 'assignment_rule',
      resourceId: result.data?.id,
      resourceName: this.summarizeRule(result.data),
      companyId: req.user.company_id,
      details: {
        assignment_type: result.data?.assignment_type,
        assigned_to: result.data?.assigned_to,
        priority: result.data?.priority,
        is_active: result.data?.is_active
      }
    });

    this.created(res, result.data, 'Assignment rule created successfully');
  });

  // Update assignment rule
  updateRule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ruleData = req.body;
    const result = await assignmentService.updateRule(id, ruleData, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    const changes = this.computeRuleChanges(result.previousRule, result.data);
    if (changes.length > 0) {
      await logAuditEvent(req, {
        action: AuditActions.ASSIGNMENT_UPDATED,
        resourceType: 'assignment_rule',
        resourceId: id,
        resourceName: this.summarizeRule(result.data),
        companyId: req.user.company_id,
        details: { changes }
      });
    }

    this.updated(res, result.data, 'Assignment rule updated successfully');
  });

  // Delete assignment rule
  deleteRule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await assignmentService.deleteRule(id, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.ASSIGNMENT_DELETED,
      resourceType: 'assignment_rule',
      resourceId: id,
      resourceName: this.summarizeRule(result.deletedRule || { id }),
      companyId: req.user.company_id,
      severity: AuditSeverity.WARNING
    });

    this.deleted(res, result.message);
  });

  // Assign lead manually
  assignLead = asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const { assignedTo, reason } = req.body;
    const assignedBy = req.user.id; // From auth middleware

    if (!assignedTo) {
      return this.validationError(res, 'assignedTo is required');
    }

    const result = await assignmentService.assignLead(leadId, assignedTo, assignedBy, reason, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    if (result.assignment) {
      await logAuditEvent(req, {
        action: AuditActions.ASSIGNMENT_UPDATED,
        resourceType: 'lead',
        resourceId: result.assignment.lead_id,
        resourceName: `Lead ${result.assignment.lead_id}`,
        companyId: req.user.company_id,
        details: {
          assigned_to: result.assignment.new_assigned_to,
          previous_assigned_to: result.assignment.previous_assigned_to,
          reason: result.assignment.reason,
          source: 'manual'
        }
      });
    }

    this.success(res, { message: result.message }, 200, 'Lead assigned successfully');
  });

  // Bulk assign leads
  bulkAssignLeads = asyncHandler(async (req, res) => {
    const { leadIds, assignedTo, reason } = req.body;
    const assignedBy = req.user.id; // From auth middleware

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return this.validationError(res, 'leadIds array is required');
    }

    if (!assignedTo) {
      return this.validationError(res, 'assignedTo is required');
    }

    const result = await assignmentService.bulkAssignLeads(leadIds, assignedTo, assignedBy, reason, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.ASSIGNMENT_UPDATED,
      resourceType: 'lead_assignment_bulk',
      resourceName: 'Bulk lead assignment',
      companyId: req.user.company_id,
      details: {
        lead_ids: leadIds,
        assigned_to: assignedTo,
        success_count: result.results.filter(r => r.success).length,
        failure_count: result.results.filter(r => !r.success).length,
        reason
      }
    });

    this.success(res, { message: result.message, results: result.results }, 200, 'Bulk assignment completed');
  });

  // Get assignment history for a lead
  getLeadAssignmentHistory = asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const result = await assignmentService.getLeadAssignmentHistory(leadId, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Lead assignment history retrieved successfully');
  });

  // Get team workload distribution
  getTeamWorkload = asyncHandler(async (req, res) => {
    const result = await assignmentService.getTeamWorkload(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Team workload distribution retrieved successfully');
  });

  // Get assignment history for the company
  getAssignmentHistory = asyncHandler(async (req, res) => {
    const result = await assignmentService.getAssignmentHistory(req.user, req.query);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Assignment history retrieved successfully');
  });

  // Redistribute leads based on workload
  redistributeLeads = asyncHandler(async (req, res) => {
    const assignedBy = req.user.id; // From auth middleware
    const result = await assignmentService.redistributeLeads(assignedBy, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, { message: result.message, results: result.results }, 200, 'Leads redistributed successfully');
  });

  // Get assignment statistics
  getAssignmentStats = asyncHandler(async (req, res) => {
    const result = await assignmentService.getAssignmentStats(req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Assignment statistics retrieved successfully');
  });

  // Auto-assign lead
  autoAssignLead = asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const assignedBy = req.user.id; // From auth middleware

    const result = await routingService.autoAssignLead(leadId, assignedBy);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, { message: result.message, assignedTo: result.assignedTo, rule: result.rule }, 200, 'Lead auto-assigned successfully');
  });

  // Process bulk auto-assignment
  processBulkAutoAssignment = asyncHandler(async (req, res) => {
    const { leadIds } = req.body;
    const assignedBy = req.user.id; // From auth middleware

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return this.validationError(res, 'leadIds array is required');
    }

    const result = await routingService.processBulkAutoAssignment(leadIds, assignedBy);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, { message: result.message, results: result.results }, 200, 'Bulk auto-assignment completed');
  });

  // Get assignment recommendations for a lead
  getAssignmentRecommendations = asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const result = await routingService.getAssignmentRecommendations(leadId);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Assignment recommendations retrieved successfully');
  });

  // Get routing statistics
  getRoutingStats = asyncHandler(async (req, res) => {
    const result = await routingService.getRoutingStats();

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, result.data, 200, 'Routing statistics retrieved successfully');
  });

  // Reassign lead
  reassignLead = asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const { newAssignedTo, reason } = req.body;
    const assignedBy = req.user.id; // From auth middleware

    if (!newAssignedTo) {
      return this.validationError(res, 'newAssignedTo is required');
    }

    const result = await routingService.reassignLead(leadId, newAssignedTo, assignedBy, reason);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    this.success(res, { message: result.message }, 200, 'Lead reassigned successfully');
  });
}

module.exports = new AssignmentController();
