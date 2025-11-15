const emailTemplateService = require('../services/emailTemplateService');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Email Template Controller
 * Handles HTTP requests for email template management
 * Extends BaseController for standardized patterns
 */
class EmailTemplateController extends BaseController {
  /**
   * Build template description for logging
   */
  describeTemplate(template = {}) {
    return template?.name || `Template ${template?.id || ''}`.trim();
  }

  /**
   * Get all templates
   * GET /api/email/templates
   */
  getTemplates = asyncHandler(async (req, res) => {
    const { folder, category, is_active, search } = req.query;

    const templates = await emailTemplateService.getTemplates(req.user, {
      folder,
      category,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search
    });

    this.success(res, templates, 200, 'Templates retrieved successfully');
  });

  /**
   * Get template by ID
   * GET /api/email/templates/:id
   */
  getTemplateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const template = await emailTemplateService.getTemplateById(id, req.user);

    if (!template) {
      return this.notFound(res, 'Template not found');
    }

    this.success(res, template, 200, 'Template retrieved successfully');
  });

  /**
   * Create template
   * POST /api/email/templates
   */
  createTemplate = asyncHandler(async (req, res) => {
    const template = await emailTemplateService.createTemplate(req.body, req.user);

    await logAuditEvent(req, {
      action: AuditActions.EMAIL_TEMPLATE_CREATED,
      resourceType: 'email_template',
      resourceId: template.id,
      resourceName: this.describeTemplate(template),
      companyId: req.user.company_id,
      details: {
        name: template.name,
        category: template.category,
        folder: template.folder
      }
    });

    this.created(res, template, 'Template created successfully');
  });

  /**
   * Update template
   * PUT /api/email/templates/:id
   */
  updateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await emailTemplateService.updateTemplate(id, req.body, req.user);

    if (!result.success) {
      return this.validationError(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.EMAIL_TEMPLATE_UPDATED,
      resourceType: 'email_template',
      resourceId: id,
      resourceName: this.describeTemplate(result.data),
      companyId: req.user.company_id,
      details: {
        name: result.data?.name
      }
    });

    this.updated(res, result.data, 'Template updated successfully');
  });

  /**
   * Delete template
   * DELETE /api/email/templates/:id
   */
  deleteTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await emailTemplateService.deleteTemplate(id, req.user);

    if (!result.success) {
      return this.notFound(res, result.error);
    }

    await logAuditEvent(req, {
      action: AuditActions.EMAIL_TEMPLATE_DELETED,
      resourceType: 'email_template',
      resourceId: id,
      resourceName: this.describeTemplate(result.deletedTemplate || { id }),
      companyId: req.user.company_id,
      severity: AuditSeverity.WARNING
    });

    this.deleted(res, 'Template deleted successfully');
  });

  /**
   * Create template version
   * POST /api/email/templates/:id/versions
   */
  createVersion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const version = await emailTemplateService.createVersion(id, req.body, req.user);

    await logAuditEvent(req, {
      action: AuditActions.EMAIL_TEMPLATE_VERSION_CREATED,
      resourceType: 'email_template_version',
      resourceId: version.id,
      resourceName: `Version ${version.version} of template ${id}`,
      companyId: req.user.company_id,
      details: {
        template_id: id,
        version: version.version,
        is_published: version.is_published
      }
    });

    this.created(res, version, 'Template version created successfully');
  });

  /**
   * Publish template version
   * POST /api/email/templates/versions/:versionId/publish
   */
  publishVersion = asyncHandler(async (req, res) => {
    const { versionId } = req.params;
    const version = await emailTemplateService.publishVersion(versionId, req.user);

    await logAuditEvent(req, {
      action: AuditActions.EMAIL_TEMPLATE_VERSION_PUBLISHED,
      resourceType: 'email_template_version',
      resourceId: versionId,
      resourceName: `Version ${version.version}`,
      companyId: req.user.company_id,
      details: {
        template_id: version.template_id,
        version: version.version
      }
    });

    this.success(res, version, 200, 'Template version published successfully');
  });

  /**
   * Compile MJML
   * POST /api/email/templates/compile-mjml
   */
  compileMJML = asyncHandler(async (req, res) => {
    const { mjml } = req.body;

    if (!mjml) {
      return this.validationError(res, 'MJML content is required');
    }

    const result = emailTemplateService.compileMJML(mjml);

    this.success(res, result, 200, 'MJML compiled successfully');
  });

  /**
   * Render template preview
   * POST /api/email/templates/versions/:versionId/preview
   */
  previewTemplate = asyncHandler(async (req, res) => {
    const { versionId } = req.params;
    const { data } = req.body;

    const rendered = await emailTemplateService.renderTemplate(versionId, data || {}, req.user);

    this.success(res, rendered, 200, 'Template rendered successfully');
  });

  /**
   * Get folders
   * GET /api/email/templates/folders
   */
  getFolders = asyncHandler(async (req, res) => {
    const folders = await emailTemplateService.getFolders(req.user);

    this.success(res, folders, 200, 'Folders retrieved successfully');
  });

  /**
   * GET /api/email/settings/integration
   */
  getIntegrationSettings = asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('integration_settings')
      .select('*')
      .eq('company_id', req.user.company_id)
      .eq('type', 'email')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // ignore 'no rows'

    this.success(res, data || null, 200, 'Integration settings retrieved successfully');
  });

  /**
   * POST /api/email/settings/integration
   */
  upsertIntegrationSettings = asyncHandler(async (req, res) => {
    const { provider, config } = req.body;
    if (!provider || !config) {
      return this.validationError(res, 'provider and config are required');
    }

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

    await logAuditEvent(req, {
      action: existing ? AuditActions.INTEGRATION_UPDATED : AuditActions.INTEGRATION_CREATED,
      resourceType: 'email_integration',
      resourceId: data.id,
      resourceName: `Email integration: ${provider}`,
      companyId: req.user.company_id,
      details: {
        provider,
        is_active: true
      }
    });

    this.success(res, data, existing ? 200 : 201, 'Integration settings saved successfully');
  });
}

module.exports = new EmailTemplateController();
