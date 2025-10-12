const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const platformController = require('../controllers/platformController');

const router = express.Router();

/**
 * Platform Routes - Super Admin Only
 * All routes require super_admin role
 */

// Authenticate all platform routes
router.use(authenticate);

// Authorize only super admins
router.use(authorize(['super_admin']));

/**
 * @route   GET /api/platform/stats
 * @desc    Get platform-wide statistics
 * @access  Super Admin
 */
router.get('/stats', platformController.getPlatformStats);

/**
 * @route   GET /api/platform/companies
 * @desc    Get all companies with stats
 * @access  Super Admin
 */
router.get('/companies', platformController.getCompanies);

/**
 * @route   GET /api/platform/companies/:companyId
 * @desc    Get company details
 * @access  Super Admin
 */
router.get('/companies/:companyId', platformController.getCompanyDetails);

/**
 * @route   PUT /api/platform/companies/:companyId/status
 * @desc    Update company status (suspend/activate)
 * @access  Super Admin
 */
router.put('/companies/:companyId/status', platformController.updateCompanyStatus);

/**
 * @route   GET /api/platform/users/search
 * @desc    Search users across all companies
 * @access  Super Admin
 */
router.get('/users/search', platformController.searchUsers);

/**
 * @route   GET /api/platform/audit-logs
 * @desc    Get audit logs
 * @access  Super Admin
 */
router.get('/audit-logs', platformController.getAuditLogs);

/**
 * @route   GET /api/platform/activity
 * @desc    Get recent platform activity
 * @access  Super Admin
 */
router.get('/activity', platformController.getRecentActivity);

module.exports = router;
