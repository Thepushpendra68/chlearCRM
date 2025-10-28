const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateUser, validateUserUpdate } = require('../validators/userValidators');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  resendInvite,
  getCurrentUser,
  updateCurrentUser
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile/me', getCurrentUser);

/**
 * @route   PUT /api/users/profile/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile/me', validateUserUpdate, updateCurrentUser);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', authorize(['company_admin', 'super_admin']), getUsers);

/**
 * @route   POST /api/users
 * @desc    Create new user (admin only)
 * @access  Private (Admin)
 */
router.post('/', authorize(['company_admin', 'super_admin']), validateUser, createUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put('/:id', validateUserUpdate, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authorize(['company_admin', 'super_admin']), deactivateUser);

/**
 * @route   POST /api/users/:id/resend-invite
 * @desc    Resend invitation email (admin only)
 * @access  Private (Admin)
 */
router.post('/:id/resend-invite', authorize(['company_admin', 'super_admin']), resendInvite);

module.exports = router;
