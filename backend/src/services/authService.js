const bcrypt = require('bcryptjs');
const { supabaseAdmin, verifySupabaseToken } = require('../config/supabase');
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
    const { email, password, first_name, last_name, role = 'sales_rep', company_id } = userData;

    // Check if user already exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser.users.some(user => user.email === email);

    if (userExists) {
      throw ApiError.conflict('User with this email already exists');
    }

    // For now, create user with a default company_id if not provided
    // In production, this should be handled by a company creation flow
    const defaultCompanyId = company_id || '00000000-0000-0000-0000-000000000000';

    try {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          role,
          company_id: defaultCompanyId
        }
      });

      if (authError) {
        throw authError;
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          company_id: defaultCompanyId,
          role,
          first_name,
          last_name,
          is_active: true,
          email_verified: true,
          created_by: authUser.user.id
        })
        .select()
        .single();

      if (profileError) {
        // Cleanup: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw profileError;
      }

      // Get complete user data
      const user = {
        id: profile.id,
        email: authUser.user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        is_active: profile.is_active,
        company_id: profile.company_id,
        created_at: profile.created_at
      };

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return {
        user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw ApiError.badRequest('Failed to create user account');
    }
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data and tokens
   */
  async login(email, password) {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Get user profile from user_profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        companies(name, subdomain)
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // User exists in auth but not in profiles - this shouldn't happen
      throw ApiError.unauthorized('User profile not found');
    }

    if (!profile.is_active) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    // Create user object
    const user = {
      id: profile.id,
      email: authData.user.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      is_active: profile.is_active,
      company_id: profile.company_id,
      company_name: profile.companies?.name,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

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
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object} User profile data
   */
  async getUserProfile(userId) {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        companies(name, subdomain)
      `)
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw ApiError.notFound('User not found');
    }

    // Get auth user email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    return {
      id: profile.id,
      email: authUser?.user?.email || '',
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      is_active: profile.is_active,
      company_id: profile.company_id,
      company_name: profile.companies?.name,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };
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
      // Check in auth.users
      const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailExists = existingAuthUsers.users.some(user =>
        user.email === email && user.id !== userId
      );

      if (emailExists) {
        throw ApiError.conflict('Email is already taken');
      }
    }

    // Update user profile
    const updatePayload = {
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      updated_at: new Date().toISOString()
    };

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select(`
        *,
        companies(name, subdomain)
      `)
      .single();

    if (error || !updatedProfile) {
      throw ApiError.notFound('User not found');
    }

    // Update email in auth.users if provided
    if (email) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (authUpdateError) {
        console.error('Failed to update auth email:', authUpdateError);
        // Don't throw here as the profile update succeeded
      }
    }

    // Get updated auth user email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    return {
      id: updatedProfile.id,
      email: authUser?.user?.email || '',
      first_name: updatedProfile.first_name,
      last_name: updatedProfile.last_name,
      role: updatedProfile.role,
      is_active: updatedProfile.is_active,
      company_id: updatedProfile.company_id,
      company_name: updatedProfile.companies?.name,
      created_at: updatedProfile.created_at,
      updated_at: updatedProfile.updated_at
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    // For Supabase Auth, we need to reauthenticate the user first
    // Get user email for reauthentication
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (!authUser?.user?.email) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password by attempting to sign in
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: authUser.user.email,
      password: currentPassword
    });

    if (verifyError || !verifyData.user) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw ApiError.badRequest('Failed to update password');
    }

    // Update last_login_at in profile
    await supabaseAdmin
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    return true;
  }
}

module.exports = new AuthService();