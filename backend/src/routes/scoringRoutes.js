const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { validateScoringRule } = require("../validators/scoringValidators");
const {
  getLeadScore,
  getScoreBreakdown,
  getScoringRules,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
  recalculateAllScores,
  calculateLeadScore,
} = require("../controllers/scoringController");

const router = express.Router();

// All scoring routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/leads/:id/score
 * @desc    Get current score for a lead
 * @access  Private
 */
router.get("/leads/:id/score", getLeadScore);

/**
 * @route   GET /api/leads/:id/score-breakdown
 * @desc    Get score breakdown and history for a lead
 * @access  Private
 */
router.get("/leads/:id/score-breakdown", getScoreBreakdown);

/**
 * @route   POST /api/leads/:id/calculate-score
 * @desc    Manually calculate score for a lead
 * @access  Private
 */
router.post("/leads/:id/calculate-score", calculateLeadScore);

/**
 * @route   GET /api/scoring/rules
 * @desc    Get all scoring rules for the company
 * @access  Private (Manager+)
 */
router.get("/rules", getScoringRules);

/**
 * @route   POST /api/scoring/rules
 * @desc    Create a new scoring rule
 * @access  Private (Manager+)
 */
router.post("/rules", validateScoringRule, createScoringRule);

/**
 * @route   PUT /api/scoring/rules/:id
 * @desc    Update a scoring rule
 * @access  Private (Manager+)
 */
router.put("/rules/:id", validateScoringRule, updateScoringRule);

/**
 * @route   DELETE /api/scoring/rules/:id
 * @desc    Delete a scoring rule
 * @access  Private (Manager+)
 */
router.delete("/rules/:id", deleteScoringRule);

/**
 * @route   POST /api/scoring/recalculate
 * @desc    Recalculate all scores for the company
 * @access  Private (Manager+)
 */
router.post("/recalculate", recalculateAllScores);

module.exports = router;
