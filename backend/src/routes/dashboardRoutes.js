const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getRecentLeads,
  getLeadTrends,
  getLeadSources,
  getLeadStatus,
  getUserPerformance,
  getBadgeCounts
} = require('../controllers/dashboardController');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/dashboard/recent-leads
 * @desc    Get recent leads
 * @access  Private
 */
router.get('/recent-leads', getRecentLeads);

/**
 * @route   GET /api/dashboard/lead-trends
 * @desc    Get lead trends over time
 * @access  Private
 */
router.get('/lead-trends', getLeadTrends);

/**
 * @route   GET /api/dashboard/lead-sources
 * @desc    Get lead source distribution
 * @access  Private
 */
router.get('/lead-sources', getLeadSources);

/**
 * @route   GET /api/dashboard/lead-status
 * @desc    Get lead status distribution
 * @access  Private
 */
router.get('/lead-status', getLeadStatus);

/**
 * @route   GET /api/dashboard/user-performance
 * @desc    Get user performance metrics (admin only)
 * @access  Private (Admin)
 */
router.get('/user-performance', authorize(['company_admin', 'super_admin']), getUserPerformance);

/**
 * @route   GET /api/dashboard/badge-counts
 * @desc    Get sidebar badge counts
 * @access  Private
 */
router.get('/badge-counts', getBadgeCounts);

module.exports = router;