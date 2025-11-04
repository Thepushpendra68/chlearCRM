const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const mjml2html = require('mjml');
const Handlebars = require('handlebars');
const juice = require('juice');
const { minify } = require('html-minifier');
const sanitizeHtml = require('sanitize-html');

/**
 * Email Template Service
 * Manages email templates, versions, compilation, and rendering
 */
class EmailTemplateService {
  /**
   * Get all templates for a company
   */
  async getTemplates(currentUser, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('email_templates')
        .select('*, created_by_user:user_profiles!created_by(id, first_name, last_name)')
        .eq('company_id', currentUser.company_id);

      // Apply filters
      if (filters.folder) {
        query = query.eq('folder', filters.folder);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw new ApiError('Failed to fetch email templates', 500);
    }
  }

  /**
   * Get single template with latest version
   */
  async getTemplateById(templateId, currentUser) {
    try {
      // Get template
      const { data: template, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('*, created_by_user:user_profiles!created_by(id, first_name, last_name)')
        .eq('id', templateId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (templateError || !template) {
        throw new ApiError('Template not found', 404);
      }

      // Get all versions
      const { data: versions, error: versionsError } = await supabaseAdmin
        .from('email_template_versions')
        .select('*, created_by_user:user_profiles!created_by(id, first_name, last_name)')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;

      template.versions = versions || [];
      template.latest_version = versions?.[0] || null;
      template.published_version = versions?.find(v => v.is_published) || null;

      return template;
    } catch (error) {
      console.error('Error fetching template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch template', 500);
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData, currentUser) {
    try {
      const { data: template, error } = await supabaseAdmin
        .from('email_templates')
        .insert({
          company_id: currentUser.company_id,
          name: templateData.name,
          description: templateData.description || null,
          folder: templateData.folder || 'general',
          category: templateData.category || null,
          is_active: templateData.is_active !== undefined ? templateData.is_active : true,
          is_shared: templateData.is_shared || false,
          tags: templateData.tags || [],
          metadata: templateData.metadata || {},
          created_by: currentUser.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ApiError('Template name already exists', 400);
        }
        throw error;
      }

      return template;
    } catch (error) {
      console.error('Error creating template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create template', 500);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, templateData, currentUser) {
    try {
      const updateData = {};
      if (templateData.name !== undefined) updateData.name = templateData.name;
      if (templateData.description !== undefined) updateData.description = templateData.description;
      if (templateData.folder !== undefined) updateData.folder = templateData.folder;
      if (templateData.category !== undefined) updateData.category = templateData.category;
      if (templateData.is_active !== undefined) updateData.is_active = templateData.is_active;
      if (templateData.is_shared !== undefined) updateData.is_shared = templateData.is_shared;
      if (templateData.tags !== undefined) updateData.tags = templateData.tags;
      if (templateData.metadata !== undefined) updateData.metadata = templateData.metadata;

      updateData.updated_at = new Date().toISOString();

      const { data: template, error } = await supabaseAdmin
        .from('email_templates')
        .update(updateData)
        .eq('id', templateId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error || !template) {
        throw new ApiError('Template not found or update failed', 404);
      }

      return template;
    } catch (error) {
      console.error('Error updating template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update template', 500);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId, currentUser) {
    try {
      // Check if template is used in active sequences
      const { data: sequenceUsage } = await supabaseAdmin
        .from('email_sequences')
        .select('id, name')
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .filter('json_definition', 'cs', `{"template_id":"${templateId}"}`);

      if (sequenceUsage && sequenceUsage.length > 0) {
        throw new ApiError(
          `Cannot delete template. It is used in ${sequenceUsage.length} active sequence(s)`,
          400
        );
      }

      const { error } = await supabaseAdmin
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('company_id', currentUser.company_id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete template', 500);
    }
  }

  /**
   * Create template version
   */
  async createVersion(templateId, versionData, currentUser) {
    try {
      console.log('[createVersion] Starting with data:', {
        templateId,
        versionData: {
          editor_type: versionData.editor_type,
          subject: versionData.subject,
          has_mjml: !!versionData.mjml,
          has_html: !!versionData.html,
          has_json_design: !!versionData.json_design
        }
      });

      // Verify template ownership
      const { data: template, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('id, company_id')
        .eq('id', templateId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (templateError) {
        console.error('[createVersion] Template lookup error:', templateError);
        throw templateError;
      }

      if (!template) {
        throw new ApiError('Template not found', 404);
      }

      // Get next version number
      const { data: latestVersion, error: versionError } = await supabaseAdmin
        .from('email_template_versions')
        .select('version_number')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      // Note: single() returns error if no rows, which is fine for first version
      const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;
      console.log('[createVersion] Next version number:', nextVersionNumber);

      // Compile MJML to HTML if needed
      let html = versionData.html;
      if (!html) {
        throw new ApiError('HTML content is required', 400);
      }

      if (versionData.editor_type === 'code' && versionData.mjml) {
        try {
          const compiled = this.compileMJML(versionData.mjml);
          html = compiled.html;
        } catch (mjmlError) {
          console.error('[createVersion] MJML compilation error:', mjmlError);
          throw new ApiError('Failed to compile MJML: ' + mjmlError.message, 400);
        }
      }

      // Inline CSS
      try {
        html = juice(html);
      } catch (juiceError) {
        console.error('[createVersion] CSS inlining error:', juiceError);
        // Non-fatal, continue with original HTML
      }

      // Extract variables
      let variables = [];
      try {
        variables = this.extractVariables(html);
      } catch (varError) {
        console.error('[createVersion] Variable extraction error:', varError);
        // Non-fatal, continue with empty array
      }

      // Prepare insert data
      const insertData = {
        template_id: templateId,
        version_number: nextVersionNumber,
        editor_type: versionData.editor_type || 'code',
        subject: versionData.subject || 'Untitled',
        from_name: versionData.from_name || null,
        from_email: versionData.from_email || null,
        reply_to: versionData.reply_to || null,
        mjml: versionData.mjml || null,
        html: html,
        text_version: versionData.text_version || this.htmlToText(html),
        json_design: versionData.json_design || null,
        variables: variables,
        is_published: versionData.is_published || false,
        published_at: versionData.is_published ? new Date().toISOString() : null,
        preview_data: versionData.preview_data || {},
        created_by: currentUser.id
      };

      console.log('[createVersion] Inserting version:', {
        template_id: insertData.template_id,
        version_number: insertData.version_number,
        editor_type: insertData.editor_type,
        subject: insertData.subject
      });

      // Create version
      const { data: version, error: insertError } = await supabaseAdmin
        .from('email_template_versions')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('[createVersion] Insert error:', insertError);
        throw new ApiError('Failed to create version: ' + insertError.message, 500);
      }

      console.log('[createVersion] Version created successfully:', version.id);

      // If publishing, unpublish other versions
      if (versionData.is_published) {
        await supabaseAdmin
          .from('email_template_versions')
          .update({ is_published: false })
          .eq('template_id', templateId)
          .neq('id', version.id);
      }

      return version;
    } catch (error) {
      console.error('[createVersion] Error:', error);
      console.error('[createVersion] Error stack:', error.stack);
      console.error('[createVersion] Error details:', JSON.stringify(error, null, 2));
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create template version: ' + (error.message || 'Unknown error'), 500);
    }
  }

  /**
   * Publish version
   */
  async publishVersion(versionId, currentUser) {
    try {
      const { data: version, error } = await supabaseAdmin
        .from('email_template_versions')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', versionId)
        .select('id, template_id')
        .single();

      if (error || !version) {
        throw new ApiError('Version not found', 404);
      }

      // Unpublish other versions
      await supabaseAdmin
        .from('email_template_versions')
        .update({ is_published: false })
        .eq('template_id', version.template_id)
        .neq('id', versionId);

      return version;
    } catch (error) {
      console.error('Error publishing version:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to publish version', 500);
    }
  }

  /**
   * Compile MJML to HTML
   */
  compileMJML(mjmlString) {
    try {
      const result = mjml2html(mjmlString, {
        validationLevel: 'soft',
        minify: true
      });

      if (result.errors && result.errors.length > 0) {
        console.warn('MJML compilation warnings:', result.errors);
      }

      return {
        html: result.html,
        errors: result.errors || []
      };
    } catch (error) {
      console.error('Error compiling MJML:', error);
      throw new ApiError('Failed to compile MJML template', 400);
    }
  }

  /**
   * Extract Handlebars variables from HTML
   */
  extractVariables(html) {
    const variables = new Set();
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const varName = match[1].trim();
      // Remove helpers and get base variable name
      const baseName = varName.split(' ')[0].replace(/[#/]/g, '');
      if (baseName && !['if', 'unless', 'each', 'with'].includes(baseName)) {
        variables.add(baseName);
      }
    }

    return Array.from(variables).map(name => ({
      name: name,
      type: this.inferVariableType(name),
      required: true
    }));
  }

  /**
   * Infer variable type from name
   */
  inferVariableType(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('date') || lowerName.includes('time')) return 'date';
    if (lowerName.includes('amount') || lowerName.includes('value') || lowerName.includes('price')) return 'number';
    if (lowerName.includes('email')) return 'email';
    if (lowerName.includes('url') || lowerName.includes('link')) return 'url';
    return 'text';
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Render template with data
   */
  async renderTemplate(versionId, data = {}, currentUser) {
    try {
      const { data: version, error } = await supabaseAdmin
        .from('email_template_versions')
        .select('*, template:email_templates!template_id(company_id)')
        .eq('id', versionId)
        .single();

      if (error || !version) {
        throw new ApiError('Template version not found', 404);
      }

      if (version.template.company_id !== currentUser.company_id) {
        throw new ApiError('Access denied', 403);
      }

      // Compile subject
      const subjectTemplate = Handlebars.compile(version.subject);
      const subject = subjectTemplate(data);

      // Compile HTML
      const htmlTemplate = Handlebars.compile(version.html);
      const html = htmlTemplate(data);

      // Compile text version
      const textTemplate = Handlebars.compile(version.text_version);
      const text = textTemplate(data);

      return {
        subject,
        html,
        text,
        from_name: version.from_name,
        from_email: version.from_email,
        reply_to: version.reply_to
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to render template', 500);
    }
  }

  /**
   * Get folders for company
   */
  async getFolders(currentUser) {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_templates')
        .select('folder')
        .eq('company_id', currentUser.company_id)
        .not('folder', 'is', null);

      if (error) throw error;

      const folders = [...new Set(data.map(t => t.folder))];
      return folders.sort();
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw new ApiError('Failed to fetch folders', 500);
    }
  }
}

module.exports = new EmailTemplateService();

