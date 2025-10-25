const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { injectIndustryConfig } = require('../middleware/industryConfig.middleware');
const { validateLead } = require('../validators/leadValidators');
const { loadLeadPicklists } = require('../middleware/picklistMiddleware');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  searchLeads
} = require('../controllers/leadController');
const pipelineController = require('../controllers/pipelineController');

const router = express.Router();

// All lead routes require authentication
router.use(authenticate);

// Inject industry configuration for all lead routes
router.use(injectIndustryConfig);

/**
 * @route   GET /api/leads
 * @desc    Get all leads with pagination and filtering
 * @access  Private
 */
router.get('/', getLeads);

/**
 * @route   GET /api/leads/stats
 * @desc    Get lead statistics
 * @access  Private
 */
router.get('/stats', getLeadStats);

/**
 * @route   GET /api/leads/:id
 * @desc    Get lead by ID
 * @access  Private
 */
router.get('/:id', getLeadById);

/**
 * @route   POST /api/leads
 * @desc    Create new lead
 * @access  Private
 */
router.post('/', loadLeadPicklists, validateLead, createLead);

/**
 * @route   PUT /api/leads/:id
 * @desc    Update lead
 * @access  Private
 */
router.put('/:id', loadLeadPicklists, validateLead, updateLead);

/**
 * @route   GET /api/leads/search
 * @desc    Search leads
 * @access  Private
 */
router.get('/search', searchLeads);

/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete lead
 * @access  Private
 */
router.delete('/:id', deleteLead);

/**
 * @route   PUT /api/leads/:id/move-stage
 * @desc    Move lead to different pipeline stage
 * @access  Private
 */
router.put('/:id/move-stage', pipelineController.moveLeadToStage);

module.exports = router;
