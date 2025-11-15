const analyticsService = require('../services/analyticsService');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Dashboard Controller
 * Handles dashboard analytics and statistics
 * Extends BaseController for standardized patterns
 */
class DashboardController extends BaseController {
  /**
   * @desc    Get dashboard statistics
   * @route   GET /api/dashboard/stats
   * @access  Private
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await analyticsService.getDashboardStats(req.user);

    this.success(res, stats, 200, 'Dashboard statistics retrieved successfully');
  });

  /**
   * @desc    Get recent leads
   * @route   GET /api/dashboard/recent-leads
   * @access  Private
   */
  getRecentLeads = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const recentLeads = await analyticsService.getRecentLeads(
      req.user,
      parseInt(limit)
    );

    this.success(res, recentLeads, 200, 'Recent leads retrieved successfully');
  });

  /**
   * @desc    Get lead trends over time
   * @route   GET /api/dashboard/lead-trends
   * @access  Private
   */
  getLeadTrends = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y
    const trends = await analyticsService.getLeadTrends(req.user, period);

    this.success(res, trends, 200, 'Lead trends retrieved successfully');
  });

  /**
   * @desc    Get lead source distribution
   * @route   GET /api/dashboard/lead-sources
   * @access  Private
   */
  getLeadSources = asyncHandler(async (req, res) => {
    const sources = await analyticsService.getLeadSources(req.user);

    this.success(res, sources, 200, 'Lead sources retrieved successfully');
  });

  /**
   * @desc    Get lead status distribution
   * @route   GET /api/dashboard/lead-status
   * @access  Private
   */
  getLeadStatus = asyncHandler(async (req, res) => {
    const status = await analyticsService.getLeadStatus(req.user);

    this.success(res, status, 200, 'Lead status retrieved successfully');
  });

  /**
   * @desc    Get user performance metrics (admin only)
   * @route   GET /api/dashboard/user-performance
   * @access  Private (Admin)
   */
  getUserPerformance = asyncHandler(async (req, res) => {
    const performance = await analyticsService.getUserPerformance();

    this.success(res, performance, 200, 'User performance retrieved successfully');
  });

  /**
   * @desc    Get sidebar badge counts
   * @route   GET /api/dashboard/badge-counts
   * @access  Private
   */
  getBadgeCounts = asyncHandler(async (req, res) => {
    const counts = await analyticsService.getBadgeCounts(req.user);

    this.success(res, counts, 200, 'Badge counts retrieved successfully');
  });
}

module.exports = new DashboardController();
