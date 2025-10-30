/**
 * Supabase Authentication Utilities
 * This module provides authentication utilities using Supabase Auth
 * replacing the traditional JWT-based authentication system.
 */

const { verifySupabaseToken, getUserProfile, supabaseAdmin } = require('../config/supabase');

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Verify Supabase JWT token and get user data
 * @param {string} token - Supabase JWT token
 * @returns {Object|null} User data with profile information or null if invalid
 */
const verifyAndGetUser = async (token) => {
  try {
    // Verify token with Supabase
    const authUser = await verifySupabaseToken(token);

    if (!authUser?.user) {
      return null;
    }

    // Get user profile with company information
    const userProfile = await getUserProfile(authUser.user.id);

    if (!userProfile) {
      return null;
    }

    // Combine auth user and profile data
    return {
      id: authUser.user.id,
      email: authUser.user.email,
      emailVerified: authUser.user.email_confirmed_at !== null,
      ...userProfile,
      authUser: authUser.user, // Keep original auth user data for reference
    };
  } catch (error) {
    console.error('Error verifying user token:', error);
    return null;
  }
};

/**
 * Create a new user with company association (admin only)
 * @param {Object} userData - User data
 * @param {string} companyId - Company ID to associate user with
 * @param {string} createdBy - ID of user creating this user
 * @returns {Object} Created user data
 */
const createUser = async (userData, companyId, createdBy) => {
  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_id: companyId,
        role: userData.role || 'sales_rep',
      },
    });

    if (authError) {
      throw authError;
    }

    // The user profile will be created automatically by the trigger
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get the created user profile
    const userProfile = await getUserProfile(authUser.user.id);

    return {
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        ...userProfile,
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Object} Update result
 */
const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Deactivate user (soft delete)
 * @param {string} userId - User ID to deactivate
 * @returns {Object} Deactivation result
 */
const deactivateUser = async (userId) => {
  try {
    // Update user profile to inactive
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Disable user in Supabase Auth (prevents login)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: 'none', // Permanently disable
    });

    if (authError) {
      console.warn('Could not disable user in auth, but profile deactivated:', authError);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get users for a company with pagination and filtering
 * @param {string} companyId - Company ID
 * @param {Object} options - Query options (page, limit, search, role)
 * @returns {Object} Users data with pagination
 */
const getCompanyUsers = async (companyId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = null,
      includeInactive = false,
    } = options;

    let query = supabaseAdmin
      .from('user_profiles_with_auth')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    // Filter by active status
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Filter by role
    if (role) {
      query = query.eq('role', role);
    }

    // Search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
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

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error('Error getting company users:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if user has required permission
 * @param {Object} user - User object with role
 * @param {string} permission - Required permission
 * @returns {boolean} True if user has permission
 */
const hasPermission = (user, permission) => {
  const rolePermissions = {
    super_admin: ['*'], // Super admin has all permissions
    company_admin: [
      'company:*', 'users:*', 'leads:*', 'activities:*',
      'reports:*', 'settings:*', 'assignments:*', 'tasks:*',
    ],
    manager: [
      'users:read', 'leads:*', 'activities:*', 'reports:*',
      'assignments:read', 'assignments:write', 'tasks:*',
    ],
    sales_rep: [
      'leads:read', 'leads:write', 'activities:read', 'activities:write',
      'reports:read', 'profile:*', 'tasks:read', 'tasks:write',
    ],
  };

  const userPermissions = rolePermissions[user.role] || [];

  // Check for wildcard permission
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check for exact permission match
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Check for wildcard within category (e.g., 'leads:*' for 'leads:read')
  const [category] = permission.split(':');
  if (userPermissions.includes(`${category}:*`)) {
    return true;
  }

  return false;
};

/**
 * Middleware to check role-based access
 * @param {string|Array} allowedRoles - Allowed roles (single role or array)
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware to check permission-based access
 * @param {string} requiredPermission - Required permission
 * @returns {Function} Middleware function
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!hasPermission(req.user, requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = {
  extractTokenFromHeader,
  verifyAndGetUser,
  createUser,
  updateUserProfile,
  deactivateUser,
  getCompanyUsers,
  hasPermission,
  requireRole,
  requirePermission,
};