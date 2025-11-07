console.log('📦 [ACCOUNT ROUTES] Loading account routes module...');
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { validateAccount } = require('../validators/accountValidators');
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountLeads,
  getAccountStats,
  getAccountTimeline
} = require('../controllers/accountController');

const router = express.Router();
console.log('✅ [ACCOUNT ROUTES] Router created successfully');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/accounts
 * @desc    Get all accounts with pagination and filtering
 * @access  Private
 */
router.get('/', getAccounts);

/**
 * @route   GET /api/accounts/:id/leads
 * @desc    Get leads associated with an account
 * @access  Private
 * @note    Must be before /:id route to avoid route conflicts
 */
router.get('/:id/leads', getAccountLeads);

/**
 * @route   GET /api/accounts/:id/stats
 * @desc    Get account statistics
 * @access  Private
 * @note    Must be before /:id route to avoid route conflicts
 */
router.get('/:id/stats', getAccountStats);

/**
 * @route   GET /api/accounts/:id/timeline
 * @desc    Get account timeline (activities, tasks, audit events)
 * @access  Private
 * @note    Must be before /:id route to avoid route conflicts
 */
router.get('/:id/timeline', getAccountTimeline);

/**
 * @route   GET /api/accounts/:id
 * @desc    Get account by ID
 * @access  Private
 * @note    Must be after specific routes like /:id/leads and /:id/stats
 */
router.get('/:id', getAccountById);

/**
 * @route   POST /api/accounts
 * @desc    Create new account
 * @access  Private
 */
router.post('/', validateAccount, createAccount);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Update account
 * @access  Private
 */
router.put('/:id', validateAccount, updateAccount);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Delete account
 * @access  Private (Admin only)
 */
router.delete('/:id', deleteAccount);

    console.log('✅ [ACCOUNT ROUTES] All routes registered:', {
      'GET /': !!getAccounts,
      'GET /:id': !!getAccountById,
      'GET /:id/leads': !!getAccountLeads,
      'GET /:id/stats': !!getAccountStats,
      'GET /:id/timeline': !!getAccountTimeline,
      'POST /': !!createAccount,
      'PUT /:id': !!updateAccount,
      'DELETE /:id': !!deleteAccount
    });

module.exports = router;

