const emailAiService = require('../services/emailAiService');
const ApiError = require('../utils/ApiError');

/**
 * Email AI Controller
 * Exposes AI-powered helpers for templates and sequences
 */
class EmailAiController {
  /**
   * Generate a template from natural language description
   * POST /api/email/templates/ai/generate
   */
  async generateTemplate(req, res, next) {
    try {
      const { description, template_type: templateType, context } = req.body || {};

      if (!description || !description.trim()) {
        throw new ApiError('description is required', 400);
      }

      const template = await emailAiService.generateTemplateFromDescription(
        description.trim(),
        templateType || 'general',
        context || {}
      );

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate subject variants
   * POST /api/email/templates/ai/subject-variants
   */
  async generateSubjectVariants(req, res, next) {
    try {
      const { subject, lead, count } = req.body || {};

      if (!subject || !subject.trim()) {
        throw new ApiError('subject is required', 400);
      }

      const variants = await emailAiService.generateSubjectVariants(
        subject.trim(),
        lead || {},
        typeof count === 'number' ? count : 5
      );

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Optimize template content
   * POST /api/email/templates/ai/optimize
   */
  async optimizeTemplate(req, res, next) {
    try {
      const { content, subject, goals } = req.body || {};

      if (!content || !content.trim()) {
        throw new ApiError('content is required', 400);
      }

      const optimization = await emailAiService.optimizeTemplateContent(
        content,
        subject || '',
        Array.isArray(goals) ? goals : undefined
      );

      res.json({
        success: true,
        data: optimization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suggest personalization variables
   * POST /api/email/templates/ai/suggest-variables
   */
  async suggestVariables(req, res, next) {
    try {
      const { content, purpose } = req.body || {};

      if (!content || !content.trim()) {
        throw new ApiError('content is required', 400);
      }

      const suggestions = await emailAiService.suggestPersonalizationVariables(
        content,
        purpose || ''
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailAiController();


