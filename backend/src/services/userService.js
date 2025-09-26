const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');

/**
 * Get all users with pagination, search, and filtering
 */
const getUsers = async (currentUser, page = 1, limit = 20, filters = {}) => {
  try {
    const supabase = supabaseAdmin;

    // Build base query
    let query = supabase
      .from('user_profiles_with_auth')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id);

    // Non-admin users can only see users in their company
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      return {
        users: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrev: false
      };
    }

    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active === 'true');
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw new ApiError('Failed to fetch users', 500);
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      users: users || [],
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new ApiError('Failed to fetch users', 500);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (id, currentUser) => {
  try {
    const supabase = supabaseAdmin;

    const { data: user, error } = await supabase
      .from('user_profiles_with_auth')
      .select('*')
      .eq('id', id)
      .eq('company_id', currentUser.company_id)
      .single();

    if (error || !user) {
      throw new ApiError('User not found', 404);
    }

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new ApiError('Failed to fetch user', 500);
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email, currentUser) => {
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
    const { data: user, error } = await supabase
      .from('user_profiles_with_auth')
      .select('*')
      .eq('id', authUser.id)
      .eq('company_id', currentUser.company_id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return user;
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

    // Check if email already exists
    const existingUser = await getUserByEmail(userData.email, currentUser);
    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }

    // Check if current user has permission to create users
    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      throw new ApiError('Insufficient permissions to create users', 403);
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_id: currentUser.company_id,
        role: userData.role || 'sales_rep',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new ApiError('Failed to create user', 500);
    }

    // The user profile will be created automatically by database triggers
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the created user profile
    const createdUser = await getUserById(authUser.user.id, currentUser);

    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('already exists')) {
      throw new ApiError('Email already exists', 400);
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
      .from('user_profiles_with_auth')
      .select('id, first_name, last_name, email, role')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching users for assignment:', error);
      throw new ApiError('Failed to fetch users for assignment', 500);
    }

    return users || [];
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
      .from('user_profiles_with_auth')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id);

    // Active users
    const { count: activeUsers } = await supabase
      .from('user_profiles_with_auth')
      .select('*', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true);

    // Users by role
    const { data: roleStats } = await supabase
      .from('user_profiles_with_auth')
      .select('role')
      .eq('company_id', currentUser.company_id);

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUsers } = await supabase
      .from('user_profiles_with_auth')
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

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deactivateUser,
  verifyPassword,
  getUsersForAssignment,
  getUserStats
};
