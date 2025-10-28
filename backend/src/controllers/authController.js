const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

const removeEmpty = (values = []) => values.filter(Boolean);

/**
 * Authentication controller for handling auth-related requests
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async register(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR'));
      }

      const { email, password, first_name, last_name, role } = req.body;

      const result = await authService.register({
        email,
        password,
        first_name,
        last_name,
        role
      });

      await logAuditEvent(req, {
        action: AuditActions.AUTH_REGISTER_SUCCESS,
        resourceType: 'user',
        resourceId: result.user?.id,
        resourceName: `${first_name} ${last_name}`.trim() || email,
        companyId: result.user?.company_id,
        actor: {
          id: result.user?.id,
          email: result.user?.email,
          role: result.user?.role
        },
        details: {
          email,
          role: result.user?.role,
          company_id: result.user?.company_id
        }
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      await logAuditEvent(req, {
        action: AuditActions.AUTH_REGISTER_FAILURE,
        resourceType: 'user',
        resourceName: req.body?.email,
        severity: AuditSeverity.WARNING,
        details: {
          reason: error?.message || 'Registration failed',
          email: req.body?.email
        }
      }).catch(() => {});

      next(error);
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async login(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR'));
      }

      const { email, password } = req.body;

      const result = await authService.login(email, password);

      await logAuditEvent(req, {
        action: AuditActions.AUTH_LOGIN_SUCCESS,
        resourceType: 'user',
        resourceId: result.user?.id,
        resourceName: `${result.user?.first_name || ''} ${result.user?.last_name || ''}`.trim() || result.user?.email,
        companyId: result.user?.company_id,
        actor: {
          id: result.user?.id,
          email: result.user?.email,
          role: result.user?.role
        },
        details: {
          email: result.user?.email,
          company_id: result.user?.company_id
        }
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      await logAuditEvent(req, {
        action: AuditActions.AUTH_LOGIN_FAILURE,
        resourceType: 'user',
        resourceName: req.body?.email,
        severity: AuditSeverity.WARNING,
        details: {
          email: req.body?.email,
          reason: error?.message || 'Login failed'
        }
      }).catch(() => {});

      next(error);
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateProfile(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR'));
      }

      const {
        first_name,
        last_name,
        email,
        phone,
        title,
        department,
        timezone,
        language
      } = req.body;
      const userId = req.user.id;

      const updatedUser = await authService.updateProfile(userId, {
        first_name,
        last_name,
        email,
        phone,
        title,
        department,
        timezone,
        language
      });

      await logAuditEvent(req, {
        action: AuditActions.USER_PROFILE_UPDATED,
        resourceType: 'user',
        resourceId: userId,
        resourceName: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email,
        companyId: updatedUser.company_id,
        details: {
          updated_fields: removeEmpty([
            first_name !== undefined && 'first_name',
            last_name !== undefined && 'last_name',
            email !== undefined && 'email',
            phone !== undefined && 'phone',
            title !== undefined && 'title',
            department !== undefined && 'department',
            timezone !== undefined && 'timezone',
            language !== undefined && 'language'
          ])
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async changePassword(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR'));
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      await authService.changePassword(userId, currentPassword, newPassword);

      await logAuditEvent(req, {
        action: AuditActions.AUTH_PASSWORD_CHANGE,
        resourceType: 'user',
        resourceId: userId,
        resourceName: req.user?.email || userId,
        companyId: req.user?.company_id
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token removal)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async logout(req, res, next) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // For enhanced security, you could implement a token blacklist
      await logAuditEvent(req, {
        action: AuditActions.AUTH_LOGOUT,
        resourceType: 'user',
        resourceId: req.user?.id || null,
        resourceName: req.user?.email || req.body?.email || 'anonymous',
        companyId: req.user?.company_id || null
      });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
