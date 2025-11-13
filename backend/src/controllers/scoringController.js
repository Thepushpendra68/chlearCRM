const { validationResult } = require('express-validator');
const scoringService = require('../services/scoringService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Get current score for a lead
 * @route   GET /api/leads/:id/score
 * @access  Private
 */
const getLeadScore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const score = await scoringService.getLeadScore(id);

    res.json({
      success: true,
      data: score
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get score breakdown and history for a lead
 * @route   GET /api/leads/:id/score-breakdown
 * @access  Private
 */
const getScoreBreakdown = async (req, res, next) => {
  try {
    const { id } = req.params;

    const breakdown = await scoringService.getScoreBreakdown(id, req.user);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all scoring rules for the company
 * @route   GET /api/scoring/rules
 * @access  Private (Manager+)
 */
const getScoringRules = async (req, res, next) => {
  try {
    const rules = await scoringService.getScoringRules(req.user);

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new scoring rule
 * @route   POST /api/scoring/rules
 * @access  Private (Manager+)
 */
const createScoringRule = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create scoring rules'
      });
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

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Scoring rule created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a scoring rule
 * @route   PUT /api/scoring/rules/:id
 * @access  Private (Manager+)
 */
const updateScoringRule = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update scoring rules'
      });
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

    res.json({
      success: true,
      data: rule,
      message: 'Scoring rule updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a scoring rule
 * @route   DELETE /api/scoring/rules/:id
 * @access  Private (Manager+)
 */
const deleteScoringRule = async (req, res, next) => {
  try {
    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete scoring rules'
      });
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

    res.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recalculate all scores for the company
 * @route   POST /api/scoring/recalculate
 * @access  Private (Manager+)
 */
const recalculateAllScores = async (req, res, next) => {
  try {
    // Check role permission
    if (!['company_admin', 'super_admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to recalculate scores'
      });
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

    res.json({
      success: true,
      data: result,
      message: `Successfully recalculated scores for ${result.updatedCount} leads`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually calculate score for a specific lead
 * @route   POST /api/leads/:id/calculate-score
 * @access  Private
 */
const calculateLeadScore = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      data: score,
      message: 'Lead score calculated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeadScore,
  getScoreBreakdown,
  getScoringRules,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
  recalculateAllScores,
  calculateLeadScore
};
