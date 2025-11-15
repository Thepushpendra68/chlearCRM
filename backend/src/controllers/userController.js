const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * User Controller
 * Handles all user-related operations
 * Extends BaseController for standardized patterns
 */
class UserController extends BaseController {
  /**
   * @desc    Get all users (admin only)
   * @route   GET /api/users
   * @access  Private (Admin)
   */
  getUsers = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      is_active = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search,
      role,
      is_active,
      sort_by,
      sort_order
    };

    const result = await userService.getUsers(
      req.user,
      parseInt(page),
      parseInt(limit),
      filters
    );

    const pagination = {
      current_page: parseInt(page),
      total_pages: result.totalPages,
      total_items: result.totalItems,
      items_per_page: parseInt(limit),
      has_next: parseInt(page) < result.totalPages,
      has_prev: parseInt(page) > 1
    };

    this.paginated(res, result.users, pagination, 200, 'Users retrieved successfully');
  });

  /**
   * @desc    Get user by ID
   * @route   GET /api/users/:id
   * @access  Private
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (!['company_admin', 'super_admin'].includes(req.user.role) && req.user.id !== id) {
      return this.forbidden(res, 'Access denied');
    }

    const user = await userService.getUserById(id, req.user);

    if (!user) {
      return this.notFound(res, 'User not found');
    }

    // Remove sensitive information
    delete user.password_hash;

    this.success(res, user, 200, 'User retrieved successfully');
  });

  /**
   * @desc    Create new user (admin only)
   * @route   POST /api/users
   * @access  Private (Admin)
   */
  createUser = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return this.validationError(res, 'Validation failed', errors.array());
    }

    const userData = req.body;
    const user = await userService.createUser(userData, req.user);

    // Remove sensitive information
    delete user.password_hash;

    this.created(res, user, 'User created successfully');
  });

  /**
   * @desc    Update user
   * @route   PUT /api/users/:id
   * @access  Private
   */
  updateUser = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return this.validationError(res, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const userData = req.body;

    // Users can only update their own profile unless they're admin
    if (!['company_admin', 'super_admin'].includes(req.user.role) && req.user.id !== id) {
      return this.forbidden(res, 'Access denied');
    }

    // Non-admin users cannot change their role
    if (!['company_admin', 'super_admin'].includes(req.user.role) && userData.role) {
      delete userData.role;
    }

    const user = await userService.updateUser(id, userData, req.user);

    if (!user) {
      return this.notFound(res, 'User not found');
    }

    // Remove sensitive information
    delete user.password_hash;

    this.updated(res, user, 'User updated successfully');
  });

  /**
   * @desc    Deactivate user (admin only)
   * @route   DELETE /api/users/:id
   * @access  Private (Admin)
   */
  deactivateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (req.user.id === id) {
      return this.validationError(res, 'Cannot deactivate your own account');
    }

    const deactivated = await userService.deactivateUser(id, req.user);

    if (!deactivated) {
      return this.notFound(res, 'User not found');
    }

    this.deleted(res, 'User deactivated successfully');
  });

  /**
   * @desc    Resend user invite (admin only)
   * @route   POST /api/users/:id/resend-invite
   * @access  Private (Admin)
   */
  resendInvite = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await userService.resendUserInvite(id, req.user);

    this.success(res, result, 200, 'Invitation email sent successfully');
  });

  /**
   * @desc    Get current user profile
   * @route   GET /api/users/profile/me
   * @access  Private
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.id, req.user);

    if (!user) {
      return this.notFound(res, 'User not found');
    }

    // Remove sensitive information
    delete user.password_hash;

    this.success(res, user, 200, 'Profile retrieved successfully');
  });

  /**
   * @desc    Update current user profile
   * @route   PUT /api/users/profile/me
   * @access  Private
   */
  updateCurrentUser = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return this.validationError(res, 'Validation failed', errors.array());
    }

    const userData = req.body;

    // Remove fields that shouldn't be updated via profile endpoint
    delete userData.role;
    delete userData.is_active;

    const user = await userService.updateUser(req.user.id, userData, req.user);

    // Remove sensitive information
    delete user.password_hash;

    this.updated(res, user, 'Profile updated successfully');
  });
}

module.exports = new UserController();
