const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
const ApiError = require('../utils/ApiError');

/**
 * Authentication service for user login, registration, and token management
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and tokens
   */
  async register(userData) {
    const { email, password, first_name, last_name, role = 'sales_rep' } = userData;

    // Check if user already exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [user] = await db('users')
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active: true
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data and tokens
   */
  async login(email, password) {
    // Find user by email
    const user = await db('users')
      .select('*')
      .where('email', email)
      .first();

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.is_active) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object} User profile data
   */
  async getUserProfile(userId) {
    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at')
      .where('id', userId)
      .first();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user data
   */
  async updateProfile(userId, updateData) {
    const { first_name, last_name, email } = updateData;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await db('users')
        .where('email', email)
        .where('id', '!=', userId)
        .first();

      if (existingUser) {
        throw ApiError.conflict('Email is already taken');
      }
    }

    const [updatedUser] = await db('users')
      .where('id', userId)
      .update({
        ...(first_name && { first_name }),
        ...(last_name && { last_name }),
        ...(email && { email }),
        updated_at: db.fn.now()
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at', 'updated_at']);

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    return updatedUser;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password hash
    const user = await db('users')
      .select('password_hash')
      .where('id', userId)
      .first();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db('users')
      .where('id', userId)
      .update({
        password_hash: newPasswordHash,
        updated_at: db.fn.now()
      });

    return true;
  }
}

module.exports = new AuthService();