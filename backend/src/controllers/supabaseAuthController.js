/**
 * Supabase Authentication Controller
 * This controller handles authentication and company registration using Supabase Auth
 * with multi-tenant support for company-scoped user management.
 */

const { validationResult } = require('express-validator');
const { createCompanyWithAdmin, supabaseAdmin } = require('../config/supabase');
const { createUser, getCompanyUsers, updateUserProfile, deactivateUser } = require('../utils/supabaseAuthUtils');
const ApiError = require('../utils/ApiError');

class SupabaseAuthController {
  /**
   * Register a new company with admin user (company creation flow)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  registerCompany = async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', errors.array()));
      }

      const {
        // Company data
        companyName,
        subdomain,
        industry,
        size,
        country,
        // User data
        email,
        password,
        firstName,
        lastName,
      } = req.body;

      // Check if subdomain is already taken
      const { data: existingCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .single();

      if (existingCompany) {
        return next(ApiError.badRequest('Subdomain is already taken'));
      }

      // Create company and admin user
      const result = await createCompanyWithAdmin(
        {
          name: companyName,
          subdomain: subdomain.toLowerCase(),
          industry,
          size,
          country,
          status: 'active',
        },
        {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Company and admin user created successfully',
        data: {
          company: result.company,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: 'company_admin',
          },
        },
      });
    } catch (error) {
      console.error('Company registration error:', error);
      next(ApiError.badRequest(error.message || 'Failed to register company'));
    }
  };

  /**
   * Create a new user within a company (company admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  createCompanyUser = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', errors.array()));
      }

      const {
        email,
        password,
        first_name,
        last_name,
        role = 'sales_rep',
        title,
        department,
      } = req.body;

      // Check if user has permission to create users in this company
      if (!req.user.company_id) {
        return next(ApiError.badRequest('User not associated with a company'));
      }

      if (!['company_admin', 'super_admin'].includes(req.user.role)) {
        return next(ApiError.forbidden('Only company admins can create users'));
      }

      const result = await createUser(
        {
          email,
          password,
          first_name,
          last_name,
          role,
          title,
          department,
        },
        req.user.company_id,
        req.user.id
      );

      if (!result.success) {
        return next(ApiError.badRequest(result.error));
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result.user,
      });
    } catch (error) {
      console.error('User creation error:', error);
      next(ApiError.internal('Failed to create user'));
    }
  };

  /**
   * Get all users for the current user's company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getUsers = async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role = null,
        includeInactive = false,
      } = req.query;

      // Determine which company's users to fetch
      let companyId = req.user.company_id;

      // Super admin can query specific company
      if (req.user.role === 'super_admin' && req.query.company_id) {
        companyId = req.query.company_id;
      }

      if (!companyId) {
        return next(ApiError.badRequest('Company ID is required'));
      }

      const result = await getCompanyUsers(companyId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        includeInactive: includeInactive === 'true',
      });

      if (!result.success) {
        return next(ApiError.internal(result.error));
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get users error:', error);
      next(ApiError.internal('Failed to fetch users'));
    }
  };

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  updateUser = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', errors.array()));
      }

      const { userId } = req.params;
      const updates = req.body;

      // Check permissions
      const canUpdate =
        req.user.id === userId || // Users can update their own profile
        ['company_admin', 'super_admin'].includes(req.user.role); // Admins can update others

      if (!canUpdate) {
        return next(ApiError.forbidden('You can only update your own profile'));
      }

      const result = await updateUserProfile(userId, updates);

      if (!result.success) {
        return next(ApiError.badRequest(result.error));
      }

      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: result.data,
      });
    } catch (error) {
      console.error('Update user error:', error);
      next(ApiError.internal('Failed to update user'));
    }
  };

  /**
   * Deactivate user (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  deactivateUser = async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Check permissions - only company admins and super admins can deactivate users
      if (!['company_admin', 'super_admin'].includes(req.user.role)) {
        return next(ApiError.forbidden('Insufficient permissions to deactivate user'));
      }

      // Prevent self-deactivation
      if (req.user.id === userId) {
        return next(ApiError.badRequest('You cannot deactivate your own account'));
      }

      const result = await deactivateUser(userId);

      if (!result.success) {
        return next(ApiError.badRequest(result.error));
      }

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      next(ApiError.internal('Failed to deactivate user'));
    }
  };

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getProfile = async (req, res, next) => {
    try {
      // req.user already contains the full profile from auth middleware
      res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          first_name: req.user.first_name,
          last_name: req.user.last_name,
          role: req.user.role,
          company_id: req.user.company_id,
          title: req.user.title,
          department: req.user.department,
          avatar_url: req.user.avatar_url,
          phone: req.user.phone,
          timezone: req.user.timezone,
          language: req.user.language,
          is_active: req.user.is_active,
          email_verified: req.user.email_verified,
          onboarding_completed: req.user.onboarding_completed,
          last_login_at: req.user.last_login_at,
          created_at: req.user.created_at,
          updated_at: req.user.updated_at,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      next(ApiError.internal('Failed to fetch profile'));
    }
  };

  /**
   * Update current user's own profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  updateProfile = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', errors.array()));
      }

      const updates = req.body;

      // Remove fields that shouldn't be updated via profile endpoint
      delete updates.role;
      delete updates.company_id;
      delete updates.is_active;

      const result = await updateUserProfile(req.user.id, updates);

      if (!result.success) {
        return next(ApiError.badRequest(result.error));
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.data,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      next(ApiError.internal('Failed to update profile'));
    }
  };

  /**
   * Get all companies (super admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getCompanies = async (req, res, next) => {
    try {
      if (req.user.role !== 'super_admin') {
        return next(ApiError.forbidden('Only super admins can view all companies'));
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        status = null,
      } = req.query;

      let query = supabaseAdmin
        .from('companies')
        .select('*', { count: 'exact' });

      // Search filter
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error('Get companies error:', error);
      next(ApiError.internal('Failed to fetch companies'));
    }
  };
}

module.exports = new SupabaseAuthController();