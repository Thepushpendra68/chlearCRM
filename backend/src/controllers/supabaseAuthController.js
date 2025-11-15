/**
 * Supabase Authentication Controller
 * This controller handles authentication and company registration using Supabase Auth
 * with multi-tenant support for company-scoped user management.
 */

const { validationResult } = require('express-validator');
const { createCompanyWithAdmin, supabaseAdmin } = require('../config/supabase');
const { createUser, getCompanyUsers, updateUserProfile, deactivateUser } = require('../utils/supabaseAuthUtils');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Supabase Authentication Controller
 * Extends BaseController for standardized patterns
 */
class SupabaseAuthController extends BaseController {
  /**
   * Register a new company with admin user (company creation flow)
   */
  registerCompany = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const {
      // Company data
      companyName,
      companySlug,
      industry,
      size,
      country,
      // User data
      email,
      password,
      firstName,
      lastName,
    } = req.body;

    // Check if company slug is already taken
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('company_slug', companySlug.toLowerCase())
      .single();

    if (existingCompany) {
      throw ApiError.badRequest('Company slug is already taken');
    }

    // Create company and admin user
    const result = await createCompanyWithAdmin(
      {
        name: companyName,
        company_slug: companySlug.toLowerCase(),
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

    this.created(res, {
      company: result.company,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: 'company_admin',
      },
      profile: result.profile,
    }, 'Company registered successfully. Please check your email to verify your account.');
  });

  /**
   * Create a new user within a company (company admin only)
   */
  createCompanyUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
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
      throw ApiError.badRequest('User not associated with a company');
    }

    if (!['company_admin', 'super_admin'].includes(req.user.role)) {
      throw ApiError.forbidden('Only company admins can create users');
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
      throw ApiError.badRequest(result.error);
    }

    this.created(res, result.user, 'User created successfully');
  });

  /**
   * Get all users for the current user's company
   */
  getUsers = asyncHandler(async (req, res) => {
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
      throw ApiError.badRequest('Company ID is required');
    }

    const result = await getCompanyUsers(companyId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
      includeInactive: includeInactive === 'true',
    });

    if (!result.success) {
      throw ApiError.internal(result.error);
    }

    this.paginated(res, result.data, parseInt(page), parseInt(limit), result.pagination.total, 200);
  });

  /**
   * Update user profile
   */
  updateUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const { userId } = req.params;
    const updates = req.body;

    // Check permissions
    const canUpdate =
      req.user.id === userId || // Users can update their own profile
      ['company_admin', 'super_admin'].includes(req.user.role); // Admins can update others

    if (!canUpdate) {
      throw ApiError.forbidden('You can only update your own profile');
    }

    const result = await updateUserProfile(userId, updates);

    if (!result.success) {
      throw ApiError.badRequest(result.error);
    }

    this.success(res, result.data, 200, 'User profile updated successfully');
  });

  /**
   * Deactivate user (soft delete)
   */
  deactivateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Check permissions - only company admins and super admins can deactivate users
    if (!['company_admin', 'super_admin'].includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions to deactivate user');
    }

    // Prevent self-deactivation
    if (req.user.id === userId) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }

    const result = await deactivateUser(userId);

    if (!result.success) {
      throw ApiError.badRequest(result.error);
    }

    this.success(res, null, 200, 'User deactivated successfully');
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req, res) => {
    // req.user already contains the full profile from auth middleware
    this.success(res, {
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
    }, 200);
  });

  /**
   * Update current user's own profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const updates = req.body;

    // Remove fields that shouldn't be updated via profile endpoint
    delete updates.role;
    delete updates.company_id;
    delete updates.is_active;

    const result = await updateUserProfile(req.user.id, updates);

    if (!result.success) {
      throw ApiError.badRequest(result.error);
    }

    this.success(res, result.data, 200, 'Profile updated successfully');
  });

  /**
   * Get all companies (super admin only)
   */
  getCompanies = asyncHandler(async (req, res) => {
    if (req.user.role !== 'super_admin') {
      throw ApiError.forbidden('Only super admins can view all companies');
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

    this.paginated(res, data, parseInt(page), parseInt(limit), count, 200);
  });
}

module.exports = new SupabaseAuthController();