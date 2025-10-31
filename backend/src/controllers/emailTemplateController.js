const emailTemplateService = require('../services/emailTemplateService');
const ApiError = require('../utils/ApiError');

/**
 * Email Template Controller
 * Handles HTTP requests for email template management
 */
class EmailTemplateController {
  /**
   * Get all templates
   * GET /api/email/templates
   */
  async getTemplates(req, res, next) {
    try {
      const { folder, category, is_active, search } = req.query;
      
      const templates = await emailTemplateService.getTemplates(req.user, {
        folder,
        category,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        search
      });

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   * GET /api/email/templates/:id
   */
  async getTemplateById(req, res, next) {
    try {
      const { id } = req.params;
      const template = await emailTemplateService.getTemplateById(id, req.user);

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create template
   * POST /api/email/templates
   */
  async createTemplate(req, res, next) {
    try {
      const template = await emailTemplateService.createTemplate(req.body, req.user);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   * PUT /api/email/templates/:id
   */
  async updateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const template = await emailTemplateService.updateTemplate(id, req.body, req.user);

      res.json({
        success: true,
        data: template,
        message: 'Template updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   * DELETE /api/email/templates/:id
   */
  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      await emailTemplateService.deleteTemplate(id, req.user);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create template version
   * POST /api/email/templates/:id/versions
   */
  async createVersion(req, res, next) {
    try {
      const { id } = req.params;
      const version = await emailTemplateService.createVersion(id, req.body, req.user);

      res.status(201).json({
        success: true,
        data: version,
        message: 'Template version created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish template version
   * POST /api/email/templates/versions/:versionId/publish
   */
  async publishVersion(req, res, next) {
    try {
      const { versionId } = req.params;
      const version = await emailTemplateService.publishVersion(versionId, req.user);

      res.json({
        success: true,
        data: version,
        message: 'Template version published successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compile MJML
   * POST /api/email/templates/compile-mjml
   */
  async compileMJML(req, res, next) {
    try {
      const { mjml } = req.body;

      if (!mjml) {
        throw new ApiError('MJML content is required', 400);
      }

      const result = emailTemplateService.compileMJML(mjml);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Render template preview
   * POST /api/email/templates/versions/:versionId/preview
   */
  async previewTemplate(req, res, next) {
    try {
      const { versionId } = req.params;
      const { data } = req.body;

      const rendered = await emailTemplateService.renderTemplate(versionId, data || {}, req.user);

      res.json({
        success: true,
        data: rendered
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get folders
   * GET /api/email/templates/folders
   */
  async getFolders(req, res, next) {
    try {
      const folders = await emailTemplateService.getFolders(req.user);

      res.json({
        success: true,
        data: folders
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailTemplateController();

