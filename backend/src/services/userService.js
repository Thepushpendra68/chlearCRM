const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');

/**
 * Get all users with pagination, search, and filtering
 */
const getUsers = async (currentUser, page = 1, limit = 20, filters = {}) => {
  try {
    const supabase = supabaseAdmin;

    console.log('🔍 [USER_SERVICE] getUsers called with:', {
      currentUser: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        company_id: currentUser.company_id
      },
      page,
      limit,
      filters
    });

    // DEBUG: Log the exact Supabase URL and client config
    console.log('🔍 [USER_SERVICE] Supabase URL:', process.env.SUPABASE_URL);
    console.log('🔍 [USER_SERVICE] Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('🔍 [USER_SERVICE] Query company_id:', currentUser.company_id);
    console.log('🔍 [USER_SERVICE] Company ID type:', typeof currentUser.company_id);
    console.log('🔍 [USER_SERVICE] Company ID length:', currentUser.company_id?.length);

    // Non-admin users can only see users in their company
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      console.log('❌ [USER_SERVICE] User is not admin, returning empty list');
      return {
        users: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrev: false
      };
    }

    // Build query
    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id);

    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.is_active !== undefined && filters.is_active !== '') {
      const isActiveFilter =
        typeof filters.is_active === 'string'
          ? filters.is_active === 'true'
          : Boolean(filters.is_active);

      query = query.eq('is_active', isActiveFilter);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    console.log('🔍 [USER_SERVICE] About to execute query...');

    // DEBUG: Test query without filter to see if we get ANY data
    const { data: testAll, error: testError } = await supabase
      .from('user_profiles')
      .select('*');
    console.log('🧪 [DEBUG] Query ALL user_profiles (no filter):', {
      count: testAll?.length || 0,
      error: testError,
      data: testAll
    });

    // DEBUG: Test query with EXACT company_id to isolate the issue
    const { data: testFiltered, error: testError2 } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073');
    console.log('🧪 [DEBUG] Query with HARDCODED company_id:', {
      count: testFiltered?.length || 0,
      error: testError2,
      data: testFiltered
    });

    const { data: users, error, count } = await query;

    console.log('🔍 [USER_SERVICE] Raw query response:', {
      data: users,
      error: error,
      count: count,
      dataType: typeof users,
      isArray: Array.isArray(users)
    });

    console.log('📊 [USER_SERVICE] Query result:', {
      userCount: users?.length || 0,
      totalCount: count,
      error: error ? error.message : 'none',
      users: users
    });

    if (error) {
      console.error('❌ [USER_SERVICE] Error fetching users:', error);
      throw new ApiError('Failed to fetch users', 500);
    }

    // Manually add email from auth.users for each user
    const usersWithEmail = await Promise.all((users || []).map(async (user) => {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
        return {
          ...user,
          email: authUser?.user?.email || null,
          email_confirmed_at: authUser?.user?.email_confirmed_at || null,
          last_sign_in_at: authUser?.user?.last_sign_in_at || null
        };
      } catch (err) {
        console.error(`Error fetching auth data for user ${user.id}:`, err);
        return { ...user, email: null };
      }
    }));

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    console.log('✅ [USER_SERVICE] Returning users:', {
      totalItems,
      totalPages,
      currentPage: page,
      userCount: usersWithEmail?.length || 0
    });

    return {
      users: usersWithEmail,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('❌ [USER_SERVICE] Error in getUsers:', error);
    throw new ApiError('Failed to fetch users', 500);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (id, currentUser = {}) => {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id);

    if (currentUser?.company_id) {
      query = query.eq('company_id', currentUser.company_id);
    }

    let { data: user, error } = await query.single();

    const shouldRetryWithoutScope =
      (error || !user) &&
      currentUser?.role === 'super_admin' &&
      currentUser?.company_id;

    if (shouldRetryWithoutScope) {
      const { data: fallbackUser, error: fallbackError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (fallbackUser) {
        user = fallbackUser;
        error = null;
      } else {
        error = fallbackError;
      }
    }

    if (error || !user) {
      throw new ApiError('User not found', 404);
    }

    // Add email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);

    if (authError) {
      console.error('Error fetching auth user:', authError);
    }

    return {
      ...user,
      email: authUser?.user?.email || null,
      email_confirmed_at: authUser?.user?.email_confirmed_at || null,
      last_sign_in_at: authUser?.user?.last_sign_in_at || null
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch user', 500);
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email, currentUser = {}) => {
  try {
    const supabase = supabaseAdmin;

    // First get the auth user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new ApiError('Failed to fetch user', 500);
    }

    const authUser = authUsers.users.find(u => u.email === email);

    if (!authUser) {
      return null;
    }

    // Then get the user profile
    let profileQuery = supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id);

    if (currentUser?.company_id) {
      profileQuery = profileQuery.eq('company_id', currentUser.company_id);
    }

    const { data: user, error } = await profileQuery.maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new ApiError('Failed to fetch user', 500);
    }

    if (user) {
      return user;
    }

    // If no profile found in scoped company, check if it exists elsewhere
    const { data: otherCompanyUser, error: otherCompanyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (otherCompanyError) {
      console.error('Error fetching user profile for other company:', otherCompanyError);
      throw new ApiError('Failed to fetch user', 500);
    }

    if (otherCompanyUser) {
      return otherCompanyUser;
    }

    // Auth user exists but profile not yet created (still treat as existing to prevent duplicates)
    return {
      id: authUser.id,
      email: authUser.email,
      existsInAuthOnly: true
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new ApiError('Failed to fetch user', 500);
  }
};

/**
 * Create new user
 */
const createUser = async (userData, currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Determine target company context
    let targetCompanyId = currentUser.company_id;

    if (currentUser.role === 'super_admin') {
      targetCompanyId = userData.company_id || targetCompanyId;
    }

    if (!targetCompanyId) {
      throw new ApiError('Target company is required to create a user', 400);
    }

    // Ensure super admin is creating user within an existing company
    if (currentUser.role === 'super_admin') {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', targetCompanyId)
        .single();

      if (companyError || !company) {
        throw new ApiError('Target company not found', 404);
      }
    }

    // Check if email already exists within target company context
    const existingUser = await getUserByEmail(userData.email, {
      ...currentUser,
      company_id: targetCompanyId
    });
    if (existingUser) {
      const message =
        existingUser.company_id && existingUser.company_id !== targetCompanyId
          ? 'Email already exists in another company'
          : 'Email already exists';
      throw new ApiError(message, 400, 'EMAIL_EXISTS');
    }

    // Check if current user has permission to create users
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      throw new ApiError('Insufficient permissions to create users', 403);
    }

    // Create user in Supabase Auth
    const role = userData.role || 'sales_rep';

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_id: targetCompanyId,
        role
      },
      app_metadata: {
        company_id: targetCompanyId,
        role
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      if (authError.code === 'email_exists') {
        throw new ApiError('Email already exists', 400, 'EMAIL_EXISTS');
      }
      throw new ApiError('Failed to create user', 500);
    }

    // The user profile will be created automatically by database triggers.
    // Poll briefly to allow the trigger to finish before fetching the profile.
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const maxAttempts = 5;
    let createdUser = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Exponential-ish backoff: first attempt after 300ms, then grow.
      const delayMs = 300 * (attempt + 1);
      await wait(delayMs);
      try {
        createdUser = await getUserById(authUser.user.id, {
          ...currentUser,
          company_id: targetCompanyId
        });
        if (createdUser) {
          break;
        }
      } catch (fetchError) {
        const isNotFound = fetchError instanceof ApiError && fetchError.statusCode === 404;
        if (isNotFound && attempt < maxAttempts - 1) {
          continue;
        }
        throw fetchError;
      }
    }

    if (!createdUser) {
      throw new ApiError('Failed to create user profile', 500);
    }

    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create user', 500);
  }
};

/**
 * Update user
 */
const updateUser = async (id, userData, currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Check if user exists and belongs to same company
    const existingUser = await getUserById(id, currentUser);
    if (!existingUser) {
      return null;
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    if (userData.first_name) updateData.first_name = userData.first_name;
    if (userData.last_name) updateData.last_name = userData.last_name;
    if (userData.role && (currentUser.role === 'company_admin' || currentUser.role === 'super_admin')) {
      updateData.role = userData.role;
    }
    if (userData.is_active !== undefined && (currentUser.role === 'company_admin' || currentUser.role === 'super_admin')) {
      updateData.is_active = userData.is_active;
    }
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.title !== undefined) updateData.title = userData.title;
    if (userData.department !== undefined) updateData.department = userData.department;
    if (userData.timezone !== undefined) updateData.timezone = userData.timezone;
    if (userData.language !== undefined) updateData.language = userData.language;

    // Handle password update (through Supabase Auth admin API)
    if (userData.password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password: userData.password
      });

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        throw new ApiError('Failed to update password', 500);
      }
    }

    // Check if email is being changed and if it already exists
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await getUserByEmail(userData.email, currentUser);
      if (emailExists) {
        throw new ApiError('Email already exists', 400);
      }

      // Update email in Supabase Auth
      const { error: emailError } = await supabase.auth.admin.updateUserById(id, {
        email: userData.email
      });

      if (emailError) {
        console.error('Error updating email:', emailError);
        throw new ApiError('Failed to update email', 500);
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', currentUser.company_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw new ApiError('Failed to update user', 500);
    }

    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message.includes('already exists')) {
      throw new ApiError('Email already exists', 400);
    }
    throw new ApiError('Failed to update user', 500);
  }
};

/**
 * Deactivate user (soft delete)
 */
const deactivateUser = async (id, currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Check if user exists and belongs to same company
    const existingUser = await getUserById(id, currentUser);
    if (!existingUser) {
      throw new ApiError('User not found', 404);
    }

    // Check permissions
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      throw new ApiError('Insufficient permissions to deactivate users', 403);
    }

    const { data: deactivatedUser, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', currentUser.company_id)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating user:', error);
      throw new ApiError('Failed to deactivate user', 500);
    }

    return deactivatedUser;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw new ApiError('Failed to deactivate user', 500);
  }
};

/**
 * Verify user password
 */
const verifyPassword = async (user, password) => {
  try {
    return await bcrypt.compare(password, user.password_hash);
  } catch (error) {
    throw new ApiError('Password verification failed', 500);
  }
};

/**
 * Get users for lead assignment (active users only)
 */
const getUsersForAssignment = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching users for assignment:', error);
      throw new ApiError('Failed to fetch users for assignment', 500);
    }

    // Add email from auth
    const usersWithEmail = await Promise.all((users || []).map(async (user) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      return { ...user, email: authUser?.user?.email || null };
    }));

    return usersWithEmail;
  } catch (error) {
    console.error('Error fetching users for assignment:', error);
    throw new ApiError('Failed to fetch users for assignment', 500);
  }
};

/**
 * Get user statistics
 */
const getUserStats = async (currentUser) => {
  try {
    const supabase = supabaseAdmin;

    // Total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id);

    // Active users
    const { count: activeUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true);

    // Users by role
    const { data: roleStats } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('company_id', currentUser.company_id);

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Convert role stats to object
    const roleDistribution = {};
    if (roleStats) {
      roleStats.forEach(stat => {
        roleDistribution[stat.role] = (roleDistribution[stat.role] || 0) + 1;
      });
    }

    return {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      recent_users: recentUsers || 0,
      role_distribution: roleDistribution
    };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw new ApiError('Failed to fetch user statistics', 500);
  }
};

/**
 * Resend an invitation email to a user
 */
const resendUserInvite = async (id, currentUser) => {
  try {
    const supabase = supabaseAdmin;

    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      throw new ApiError('Insufficient permissions to resend invites', 403);
    }

    const targetUser = await getUserById(id, currentUser);

    if (!targetUser) {
      throw new ApiError('User not found', 404);
    }

    const redirectUrl = process.env.APP_URL
      ? `${process.env.APP_URL.replace(/\/$/, '')}/login`
      : undefined;

    const { error } = await supabase.auth.admin.inviteUserByEmail(targetUser.email, {
      data: {
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        role: targetUser.role,
        company_id: targetUser.company_id
      },
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Error resending invite:', error);
      throw new ApiError('Failed to resend invite', 500);
    }

    return {
      email: targetUser.email
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('Error resending invite:', error);
    throw new ApiError('Failed to resend invite', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deactivateUser,
  verifyPassword,
  getUsersForAssignment,
  getUserStats,
  resendUserInvite
};
