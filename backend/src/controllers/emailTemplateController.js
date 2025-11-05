const emailTemplateService = require('../services/emailTemplateService');
const emailAiService = require('../services/emailAiService');
const leadService = require('../services/leadService');
const { supabaseAdmin } = require('../config/supabase');
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

  /**
   * GET /api/email/settings/integration
   */
  async getIntegrationSettings(req, res, next) {
    try {
      const { data, error } = await supabaseAdmin
        .from('integration_settings')
        .select('*')
        .eq('company_id', req.user.company_id)
        .eq('type', 'email')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // ignore 'no rows'

      res.json({ success: true, data: data || null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/email/settings/integration
   */
  async upsertIntegrationSettings(req, res, next) {
    try {
      const { provider, config } = req.body;
      if (!provider || !config) throw new ApiError('provider and config are required', 400);

      const { data: existing } = await supabaseAdmin
        .from('integration_settings')
        .select('id')
        .eq('company_id', req.user.company_id)
        .eq('type', 'email')
        .single();

      const payload = {
        company_id: req.user.company_id,
        type: 'email',
        provider,
        config,
        is_active: true,
        created_by: req.user.id,
        updated_at: new Date().toISOString()
      };

      let query;
      if (existing) {
        query = supabaseAdmin
          .from('integration_settings')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        query = supabaseAdmin
          .from('integration_settings')
          .insert(payload)
          .select()
          .single();
      }

      const { data, error } = await query;
      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // AI ENDPOINTS
  // ============================================

  /**
   * Generate template from description using AI
   * POST /api/email/ai/generate-template
   */
  async aiGenerateTemplate(req, res, next) {
    try {
      const { description, template_type, context } = req.body;

      if (!description) {
        throw new ApiError('Description is required', 400);
      }

      const templateData = await emailAiService.generateTemplateFromDescription(
        description,
        template_type,
        context
      );

      res.json({
        success: true,
        data: templateData,
        message: 'Template generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate subject line variants using AI
   * POST /api/email/ai/generate-subject-variants
   */
  async aiGenerateSubjectVariants(req, res, next) {
    try {
      const { subject, lead_id, count } = req.body;

      if (!subject) {
        throw new ApiError('Subject is required', 400);
      }

      let lead = {};
      if (lead_id) {
        lead = await leadService.getLeadById(lead_id, req.user);
      }

      const variants = await emailAiService.generateSubjectVariants(
        subject,
        lead,
        count || 5
      );

      res.json({
        success: true,
        data: variants
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Optimize template content using AI
   * POST /api/email/ai/optimize-content
   */
  async aiOptimizeContent(req, res, next) {
    try {
      const { html, subject, goals } = req.body;

      if (!html || !subject) {
        throw new ApiError('HTML and subject are required', 400);
      }

      const optimized = await emailAiService.optimizeTemplateContent(
        html,
        subject,
        goals || ['engagement', 'clarity']
      );

      res.json({
        success: true,
        data: optimized
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suggest personalization variables using AI
   * POST /api/email/ai/suggest-variables
   */
  async aiSuggestVariables(req, res, next) {
    try {
      const { html, purpose } = req.body;

      if (!html) {
        throw new ApiError('HTML is required', 400);
      }

      const suggestions = await emailAiService.suggestPersonalizationVariables(
        html,
        purpose || ''
      );

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate email sequence using AI
   * POST /api/email/ai/generate-sequence
   */
  async aiGenerateSequence(req, res, next) {
    try {
      const { goal, lead_type, sequence_length } = req.body;

      if (!goal) {
        throw new ApiError('Goal is required', 400);
      }

      const sequence = await emailAiService.generateSequenceFromGoal(
        goal,
        lead_type || 'prospect',
        sequence_length || 5
      );

      res.json({
        success: true,
        data: sequence
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Optimize sequence timing using AI
   * POST /api/email/ai/optimize-timing
   */
  async aiOptimizeTiming(req, res, next) {
    try {
      const { sequence_steps, target_audience } = req.body;

      if (!sequence_steps) {
        throw new ApiError('Sequence steps are required', 400);
      }

      const optimized = await emailAiService.suggestSequenceTiming(
        sequence_steps,
        target_audience || {}
      );

      res.json({
        success: true,
        data: optimized
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate personalized subject for lead using AI
   * POST /api/email/ai/personalized-subject
   */
  async aiPersonalizedSubject(req, res, next) {
    try {
      const { lead_id, email_context } = req.body;

      if (!lead_id) {
        throw new ApiError('Lead ID is required', 400);
      }

      const lead = await leadService.getLeadById(lead_id, req.user);
      const subject = await emailAiService.generatePersonalizedSubject(
        lead,
        email_context || {}
      );

      res.json({
        success: true,
        data: { subject }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate personalized email body for lead using AI
   * POST /api/email/ai/personalized-email
   */
  async aiPersonalizedEmail(req, res, next) {
    try {
      const { lead_id, template_context } = req.body;

      if (!lead_id) {
        throw new ApiError('Lead ID is required', 400);
      }

      const lead = await leadService.getLeadById(lead_id, req.user);
      const emailData = await emailAiService.generatePersonalizedEmailBody(
        lead,
        template_context || {}
      );

      res.json({
        success: true,
        data: emailData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suggest optimal send time using AI
   * POST /api/email/ai/optimal-send-time
   */
  async aiOptimalSendTime(req, res, next) {
    try {
      const { lead_id, timezone } = req.body;

      if (!lead_id) {
        throw new ApiError('Lead ID is required', 400);
      }

      const lead = await leadService.getLeadById(lead_id, req.user);
      const sendTime = await emailAiService.suggestOptimalSendTime(
        lead,
        timezone || 'America/New_York'
      );

      res.json({
        success: true,
        data: sendTime
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze email performance using AI
   * POST /api/email/ai/analyze-performance
   */
  async aiAnalyzePerformance(req, res, next) {
    try {
      const { metrics, template_info } = req.body;

      if (!metrics) {
        throw new ApiError('Metrics are required', 400);
      }

      const analysis = await emailAiService.analyzeEmailPerformance(
        metrics,
        template_info || {}
      );

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Predict engagement likelihood using AI
   * POST /api/email/ai/predict-engagement
   */
  async aiPredictEngagement(req, res, next) {
    try {
      const { lead_id, email_data, historical_data } = req.body;

      if (!lead_id || !email_data) {
        throw new ApiError('Lead ID and email data are required', 400);
      }

      const lead = await leadService.getLeadById(lead_id, req.user);
      const prediction = await emailAiService.predictEngagement(
        lead,
        email_data,
        historical_data || {}
      );

      res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if AI features are available
   * GET /api/email/ai/status
   */
  async aiStatus(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          available: emailAiService.isAvailable(),
          features: [
            'template_generation',
            'subject_variants',
            'content_optimization',
            'personalization_suggestions',
            'sequence_generation',
            'timing_optimization',
            'personalized_content',
            'send_time_optimization',
            'performance_analysis',
            'engagement_prediction'
          ]
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailTemplateController();

