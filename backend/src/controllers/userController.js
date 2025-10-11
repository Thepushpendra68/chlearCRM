const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
const getUsers = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      data: result.users,
      pagination: {
        current_page: parseInt(page),
        total_pages: result.totalPages,
        total_items: result.totalItems,
        items_per_page: parseInt(limit),
        has_next: parseInt(page) < result.totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile unless they're admin
    if (!['company_admin', 'super_admin'].includes(req.user.role) && req.user.id !== id) {
      throw new ApiError('Access denied', 403);
    }

    const user = await userService.getUserById(id, req.user);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Remove sensitive information
    delete user.password_hash;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user (admin only)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
const createUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
    }

    const userData = req.body;
    const user = await userService.createUser(userData, req.user);

    // Remove sensitive information
    delete user.password_hash;

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const userData = req.body;

    // Users can only update their own profile unless they're admin
    if (!['company_admin', 'super_admin'].includes(req.user.role) && req.user.id !== id) {
      throw new ApiError('Access denied', 403);
    }

    // Non-admin users cannot change their role
    if (!['company_admin', 'super_admin'].includes(req.user.role) && userData.role) {
      delete userData.role;
    }

    const user = await userService.updateUser(id, userData, req.user);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Remove sensitive information
    delete user.password_hash;

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate user (admin only)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (req.user.id === id) {
      throw new ApiError('Cannot deactivate your own account', 400);
    }

    const deactivated = await userService.deactivateUser(id, req.user);

    if (!deactivated) {
      throw new ApiError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend user invite (admin only)
 * @route   POST /api/users/:id/resend-invite
 * @access  Private (Admin)
 */
const resendInvite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await userService.resendUserInvite(id, req.user);

    res.json({
      success: true,
      message: 'Invitation email sent successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile/me
 * @access  Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id, req.user);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Remove sensitive information
    delete user.password_hash;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile/me
 * @access  Private
 */
const updateCurrentUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
    }

    const userData = req.body;
    
    // Remove fields that shouldn't be updated via profile endpoint
    delete userData.role;
    delete userData.is_active;

    const user = await userService.updateUser(req.user.id, userData, req.user);

    // Remove sensitive information
    delete user.password_hash;

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  resendInvite,
  getCurrentUser,
  updateCurrentUser
};
