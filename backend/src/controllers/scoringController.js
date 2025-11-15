const { validationResult } = require('express-validator');
const scoringService = require('../services/scoringService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Scoring Controller
 * Handles lead scoring operations
 * Extends BaseController for standardized patterns
 */
class ScoringController extends BaseController {
  /**
   * Get current score for a lead
   */
  getLeadScore = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const score = await scoringService.getLeadScore(id);

    this.success(res, score, 200);
  });

  /**
   * Get score breakdown and history for a lead
   */
  getScoreBreakdown = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const breakdown = await scoringService.getScoreBreakdown(id, req.user);

    this.success(res, breakdown, 200);
  });

  /**
   * Get all scoring rules for the company
   */
  getScoringRules = asyncHandler(async (req, res) => {
    const rules = await scoringService.getScoringRules(req.user);

    this.success(res, rules, 200);
  });

  /**
   * Create a new scoring rule
   */
  createScoringRule = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions to create scoring rules');
    }

    const rule = await scoringService.createScoringRule(req.body, req.user);

    // Log audit event
    await logAuditEvent({
      action: AuditActions.SCORING_RULE_CREATED,
      severity: AuditSeverity.INFO,
      userId: req.user.id,
      companyId: req.user.company_id,
      entityType: 'scoring_rule',
      entityId: rule.id,
      details: {
        rule_name: rule.name,
        rule_type: rule.rule_type,
        score_value: rule.score_value
      }
    });

    this.created(res, rule, 'Scoring rule created successfully');
  });

  /**
   * Update a scoring rule
   */
  updateScoringRule = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions to update scoring rules');
    }

    const { id } = req.params;
    const rule = await scoringService.updateScoringRule(id, req.body, req.user);

    // Log audit event
    await logAuditEvent({
      action: AuditActions.SCORING_RULE_UPDATED,
      severity: AuditSeverity.INFO,
      userId: req.user.id,
      companyId: req.user.company_id,
      entityType: 'scoring_rule',
      entityId: id,
      details: {
        rule_name: rule.name,
        rule_type: rule.rule_type,
        score_value: rule.score_value
      }
    });

    this.success(res, rule, 200, 'Scoring rule updated successfully');
  });

  /**
   * Delete a scoring rule
   */
  deleteScoringRule = asyncHandler(async (req, res) => {
    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions to delete scoring rules');
    }

    const { id } = req.params;
    await scoringService.deleteScoringRule(id, req.user);

    // Log audit event
    await logAuditEvent({
      action: AuditActions.SCORING_RULE_DELETED,
      severity: AuditSeverity.INFO,
      userId: req.user.id,
      companyId: req.user.company_id,
      entityType: 'scoring_rule',
      entityId: id,
      details: {
        message: 'Scoring rule deleted'
      }
    });

    this.success(res, null, 200, 'Scoring rule deleted successfully');
  });

  /**
   * Recalculate all scores for the company
   */
  recalculateAllScores = asyncHandler(async (req, res) => {
    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions to recalculate scores');
    }

    const result = await scoringService.recalculateAllScores(req.user);

    // Log audit event
    await logAuditEvent({
      action: AuditActions.SCORES_RECALCULATED,
      severity: AuditSeverity.INFO,
      userId: req.user.id,
      companyId: req.user.company_id,
      entityType: 'scoring',
      entityId: req.user.company_id,
      details: {
        leads_updated: result.updatedCount
      }
    });

    this.success(res, result, 200, `Successfully recalculated scores for ${result.updatedCount} leads`);
  });

  /**
   * Manually calculate score for a specific lead
   */
  calculateLeadScore = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const score = await scoringService.calculateLeadScore(id);

    // Log audit event
    await logAuditEvent({
      action: AuditActions.LEAD_SCORE_CALCULATED,
      severity: AuditSeverity.INFO,
      userId: req.user.id,
      companyId: req.user.company_id,
      entityType: 'lead',
      entityId: id,
      details: {
        new_score: score.current_score
      }
    });

    this.success(res, score, 200, 'Lead score calculated successfully');
  });
}

module.exports = new ScoringController();
