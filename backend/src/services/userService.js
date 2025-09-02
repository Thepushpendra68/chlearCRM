const knex = require('../config/database');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');

/**
 * Get all users with pagination, search, and filtering
 */
const getUsers = async (page = 1, limit = 20, filters = {}) => {
  try {
    const offset = (page - 1) * limit;
    
    let query = knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at');

    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(function() {
        this.where('first_name', 'ilike', searchTerm)
          .orWhere('last_name', 'ilike', searchTerm)
          .orWhere('email', 'ilike', searchTerm);
      });
    }

    if (filters.role) {
      query = query.where('role', filters.role);
    }

    if (filters.is_active !== '') {
      query = query.where('is_active', filters.is_active === 'true');
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    // Get total count for pagination
    const countQuery = query.clone().clearSelect().clearOrder().count('* as count');
    const [{ count }] = await countQuery;
    const totalItems = parseInt(count);
    const totalPages = Math.ceil(totalItems / limit);

    // Apply pagination
    const users = await query.limit(limit).offset(offset);

    return {
      users,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  } catch (error) {
    throw new ApiError('Failed to fetch users', 500);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  try {
    const user = await knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at')
      .where('id', id)
      .first();

    return user;
  } catch (error) {
    throw new ApiError('Failed to fetch user', 500);
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  try {
    const user = await knex('users')
      .where('email', email)
      .first();

    return user;
  } catch (error) {
    throw new ApiError('Failed to fetch user', 500);
  }
};

/**
 * Create new user
 */
const createUser = async (userData) => {
  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    const [user] = await knex('users')
      .insert({
        email: userData.email,
        password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'sales_rep',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at']);

    return user;
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
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
    // Check if user exists
    const existingUser = await knex('users').where('id', id).first();
    if (!existingUser) {
      return null;
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date()
    };

    // Only update provided fields
    if (userData.email) updateData.email = userData.email;
    if (userData.first_name) updateData.first_name = userData.first_name;
    if (userData.last_name) updateData.last_name = userData.last_name;
    if (userData.role && currentUser.role === 'admin') updateData.role = userData.role;
    if (userData.is_active !== undefined && currentUser.role === 'admin') updateData.is_active = userData.is_active;

    // Handle password update
    if (userData.password) {
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(userData.password, saltRounds);
    }

    // Check if email is being changed and if it already exists
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await getUserByEmail(userData.email);
      if (emailExists) {
        throw new ApiError('Email already exists', 400);
      }
    }

    const [updatedUser] = await knex('users')
      .where('id', id)
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at']);

    return updatedUser;
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new ApiError('Email already exists', 400);
    }
    throw new ApiError('Failed to update user', 500);
  }
};

/**
 * Deactivate user (soft delete)
 */
const deactivateUser = async (id) => {
  try {
    const [deactivatedUser] = await knex('users')
      .where('id', id)
      .update({
        is_active: false,
        updated_at: new Date()
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at']);

    return deactivatedUser;
  } catch (error) {
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
const getUsersForAssignment = async () => {
  try {
    const users = await knex('users')
      .select('id', 'first_name', 'last_name', 'email', 'role')
      .where('is_active', true)
      .orderBy('first_name', 'asc');

    return users;
  } catch (error) {
    throw new ApiError('Failed to fetch users for assignment', 500);
  }
};

/**
 * Get user statistics
 */
const getUserStats = async () => {
  try {
    // Total users
    const [{ total_users }] = await knex('users').count('* as total_users');

    // Active users
    const [{ active_users }] = await knex('users')
      .where('is_active', true)
      .count('* as active_users');

    // Users by role
    const roleStats = await knex('users')
      .select('role')
      .count('* as count')
      .groupBy('role');

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [{ recent_users }] = await knex('users')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as recent_users');

    // Convert role stats to object
    const roleDistribution = {};
    roleStats.forEach(stat => {
      roleDistribution[stat.role] = parseInt(stat.count);
    });

    return {
      total_users: parseInt(total_users),
      active_users: parseInt(active_users),
      recent_users: parseInt(recent_users),
      role_distribution: roleDistribution
    };
  } catch (error) {
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
