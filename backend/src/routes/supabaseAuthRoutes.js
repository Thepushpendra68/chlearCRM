/**
 * Supabase Authentication Routes
 * Routes for handling company registration, user management, and authentication
 * using Supabase Auth with multi-tenant support.
 */

const express = require('express');
const router = express.Router();

const supabaseAuthController = require('../controllers/supabaseAuthController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  validateCompanyRegistration,
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
  validateGetUsers,
  validateGetCompanies,
} = require('../validators/companyValidators');

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register-company
 * @desc    Register a new company with admin user
 * @access  Public
 */
router.post(
  '/register-company',
  validateCompanyRegistration,
  supabaseAuthController.registerCompany
);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  supabaseAuthController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  validateUpdateUser,
  supabaseAuthController.updateProfile
);

// User management routes (company admin and super admin only)

/**
 * @route   POST /api/auth/users
 * @desc    Create a new user in the company
 * @access  Private (Company Admin, Super Admin)
 */
router.post(
  '/users',
  authenticate,
  authorize(['company_admin', 'super_admin']),
  validateCreateUser,
  supabaseAuthController.createCompanyUser
);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users for the company (with pagination and filters)
 * @access  Private (Company Admin, Super Admin)
 */
router.get(
  '/users',
  authenticate,
  authorize(['company_admin', 'super_admin', 'manager']),
  validateGetUsers,
  supabaseAuthController.getUsers
);

/**
 * @route   PUT /api/auth/users/:userId
 * @desc    Update user profile (admin can update others, users can update themselves)
 * @access  Private
 */
router.put(
  '/users/:userId',
  authenticate,
  validateUserId,
  validateUpdateUser,
  supabaseAuthController.updateUser
);

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Deactivate user (soft delete)
 * @access  Private (Company Admin, Super Admin)
 */
router.delete(
  '/users/:userId',
  authenticate,
  authorize(['company_admin', 'super_admin']),
  validateUserId,
  supabaseAuthController.deactivateUser
);

// Super admin only routes

/**
 * @route   GET /api/auth/companies
 * @desc    Get all companies (super admin only)
 * @access  Private (Super Admin)
 */
router.get(
  '/companies',
  authenticate,
  authorize(['super_admin']),
  validateGetCompanies,
  supabaseAuthController.getCompanies
);

module.exports = router;