const workflowTemplateService = require('../services/workflowTemplateService');
const ApiError = require('../utils/ApiError');

/**
 * Workflow Template Controller
 * Handles HTTP requests for workflow template library
 */
class WorkflowTemplateController {
  /**
   * Get all templates
   * GET /api/email/workflow-templates
   */
  async getTemplates(req, res, next) {
    try {
      const { category, industry, search, is_active, include_public } = req.query;
      
      const templates = await workflowTemplateService.getTemplates(req.user, {
        category,
        industry,
        search,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        include_public: include_public !== undefined ? include_public === 'true' : true
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
   * GET /api/email/workflow-templates/:id
   */
  async getTemplateById(req, res, next) {
    try {
      const { id } = req.params;
      const template = await workflowTemplateService.getTemplateById(id, req.user);

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
   * POST /api/email/workflow-templates
   */
  async createTemplate(req, res, next) {
    try {
      const template = await workflowTemplateService.createTemplate(req.body, req.user);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Workflow template created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create sequence from template
   * POST /api/email/workflow-templates/:id/create-sequence
   */
  async createSequenceFromTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const sequence = await workflowTemplateService.createSequenceFromTemplate(
        id,
        req.body,
        req.user
      );

      res.status(201).json({
        success: true,
        data: sequence,
        message: 'Sequence created from template successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   * PUT /api/email/workflow-templates/:id
   */
  async updateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const template = await workflowTemplateService.updateTemplate(id, req.body, req.user);

      res.json({
        success: true,
        data: template,
        message: 'Workflow template updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   * DELETE /api/email/workflow-templates/:id
   */
  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      await workflowTemplateService.deleteTemplate(id, req.user);

      res.json({
        success: true,
        message: 'Workflow template deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export template as JSON
   * GET /api/email/workflow-templates/:id/export
   */
  async exportTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const exportData = await workflowTemplateService.exportTemplate(id, req.user);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.json"`);
      
      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import template from JSON
   * POST /api/email/workflow-templates/import
   */
  async importTemplate(req, res, next) {
    try {
      const template = await workflowTemplateService.importTemplate(req.body, req.user);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Workflow template imported successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template packs
   * GET /api/email/workflow-templates/packs
   */
  async getTemplatePacks(req, res, next) {
    try {
      const { industry, search } = req.query;
      
      const packs = await workflowTemplateService.getTemplatePacks({
        industry,
        search
      });

      res.json({
        success: true,
        data: packs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pack by ID
   * GET /api/email/workflow-templates/packs/:id
   */
  async getPackById(req, res, next) {
    try {
      const { id } = req.params;
      const pack = await workflowTemplateService.getPackById(id);

      res.json({
        success: true,
        data: pack
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowTemplateController();

