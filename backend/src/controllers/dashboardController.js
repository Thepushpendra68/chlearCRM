const analyticsService = require('../services/analyticsService');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent leads
 * @route   GET /api/dashboard/recent-leads
 * @access  Private
 */
const getRecentLeads = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const recentLeads = await analyticsService.getRecentLeads(
      req.user,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recentLeads
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead trends over time
 * @route   GET /api/dashboard/lead-trends
 * @access  Private
 */
const getLeadTrends = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y
    const trends = await analyticsService.getLeadTrends(req.user, period);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead source distribution
 * @route   GET /api/dashboard/lead-sources
 * @access  Private
 */
const getLeadSources = async (req, res, next) => {
  try {
    const sources = await analyticsService.getLeadSources(req.user);

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get lead status distribution
 * @route   GET /api/dashboard/lead-status
 * @access  Private
 */
const getLeadStatus = async (req, res, next) => {
  try {
    const status = await analyticsService.getLeadStatus(req.user);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user performance metrics (admin only)
 * @route   GET /api/dashboard/user-performance
 * @access  Private (Admin)
 */
const getUserPerformance = async (req, res, next) => {
  try {
    const performance = await analyticsService.getUserPerformance();

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sidebar badge counts
 * @route   GET /api/dashboard/badge-counts
 * @access  Private
 */
const getBadgeCounts = async (req, res, next) => {
  try {
    const counts = await analyticsService.getBadgeCounts(req.user);

    res.json({
      success: true,
      data: counts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRecentLeads,
  getLeadTrends,
  getLeadSources,
  getLeadStatus,
  getUserPerformance,
  getBadgeCounts
};
