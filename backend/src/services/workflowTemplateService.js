const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Workflow Template Service
 * Manages reusable workflow templates and industry packs
 */
class WorkflowTemplateService {
  /**
   * Get all templates (user's company + public)
   */
  async getTemplates(currentUser, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('workflow_templates')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by company (user's templates) or public templates
      if (filters.include_public !== false) {
        query = query.or(`company_id.eq.${currentUser.company_id},is_public.eq.true`);
      } else {
        query = query.eq('company_id', currentUser.company_id);
      }

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      throw new ApiError('Failed to fetch workflow templates', 500);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId, currentUser) {
    try {
      const { data: template, error } = await supabaseAdmin
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .or(`company_id.eq.${currentUser.company_id},is_public.eq.true`)
        .single();

      if (error || !template) {
        throw new ApiError('Workflow template not found', 404);
      }

      return template;
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch workflow template', 500);
    }
  }

  /**
   * Create template from sequence or scratch
   */
  async createTemplate(templateData, currentUser) {
    try {
      const insertData = {
        company_id: currentUser.company_id,
        name: templateData.name,
        description: templateData.description || null,
        json_definition: templateData.json_definition,
        category: templateData.category || null,
        industry: templateData.industry || 'general',
        tags: templateData.tags || [],
        entry_conditions: templateData.entry_conditions || null,
        exit_on_reply: templateData.exit_on_reply !== undefined ? templateData.exit_on_reply : true,
        exit_on_goal: templateData.exit_on_goal || null,
        send_time_window: templateData.send_time_window || null,
        max_emails_per_day: templateData.max_emails_per_day || 3,
        is_public: templateData.is_public || false,
        is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        created_by: currentUser.id
      };

      const { data: template, error } = await supabaseAdmin
        .from('workflow_templates')
        .insert(insertData)
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
      console.error('Error creating workflow template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create workflow template', 500);
    }
  }

  /**
   * Create sequence from template
   */
  async createSequenceFromTemplate(templateId, sequenceData, currentUser) {
    try {
      // Get template
      const template = await this.getTemplateById(templateId, currentUser);

      // Import automation service to create sequence
      const automationService = require('./automationService');

      // Prepare sequence data from template
      const newSequenceData = {
        name: sequenceData.name || template.name,
        description: sequenceData.description || template.description,
        json_definition: template.json_definition,
        entry_conditions: sequenceData.entry_conditions || template.entry_conditions,
        exit_on_reply: template.exit_on_reply,
        exit_on_goal: template.exit_on_goal,
        send_time_window: sequenceData.send_time_window || template.send_time_window,
        max_emails_per_day: template.max_emails_per_day,
        is_active: false // Start inactive so user can customize
      };

      // Create sequence
      const sequence = await automationService.createSequence(newSequenceData, currentUser);

      // Update template usage stats
      await supabaseAdmin
        .from('workflow_templates')
        .update({
          usage_count: template.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', templateId);

      return sequence;
    } catch (error) {
      console.error('Error creating sequence from template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create sequence from template', 500);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, templateData, currentUser) {
    try {
      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from('workflow_templates')
        .select('company_id')
        .eq('id', templateId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (!existing) {
        throw new ApiError('Template not found or access denied', 404);
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (templateData.name !== undefined) updateData.name = templateData.name;
      if (templateData.description !== undefined) updateData.description = templateData.description;
      if (templateData.json_definition !== undefined) updateData.json_definition = templateData.json_definition;
      if (templateData.category !== undefined) updateData.category = templateData.category;
      if (templateData.industry !== undefined) updateData.industry = templateData.industry;
      if (templateData.tags !== undefined) updateData.tags = templateData.tags;
      if (templateData.is_active !== undefined) updateData.is_active = templateData.is_active;
      if (templateData.is_public !== undefined) updateData.is_public = templateData.is_public;

      const { data: template, error } = await supabaseAdmin
        .from('workflow_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      return template;
    } catch (error) {
      console.error('Error updating workflow template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update workflow template', 500);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId, currentUser) {
    try {
      const { error } = await supabaseAdmin
        .from('workflow_templates')
        .delete()
        .eq('id', templateId)
        .eq('company_id', currentUser.company_id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      throw new ApiError('Failed to delete workflow template', 500);
    }
  }

  /**
   * Export template as JSON
   */
  async exportTemplate(templateId, currentUser) {
    try {
      const template = await this.getTemplateById(templateId, currentUser);
      
      // Return exportable format
      return {
        name: template.name,
        description: template.description,
        category: template.category,
        industry: template.industry,
        tags: template.tags,
        json_definition: template.json_definition,
        entry_conditions: template.entry_conditions,
        exit_on_reply: template.exit_on_reply,
        exit_on_goal: template.exit_on_goal,
        send_time_window: template.send_time_window,
        max_emails_per_day: template.max_emails_per_day,
        version: '1.0',
        exported_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting workflow template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to export workflow template', 500);
    }
  }

  /**
   * Import template from JSON
   */
  async importTemplate(importData, currentUser) {
    try {
      // Validate import data
      if (!importData.name || !importData.json_definition) {
        throw new ApiError('Invalid template format: name and json_definition required', 400);
      }

      // Create template from imported data
      const templateData = {
        name: importData.name,
        description: importData.description || null,
        json_definition: importData.json_definition,
        category: importData.category || null,
        industry: importData.industry || 'general',
        tags: importData.tags || [],
        entry_conditions: importData.entry_conditions || null,
        exit_on_reply: importData.exit_on_reply !== undefined ? importData.exit_on_reply : true,
        exit_on_goal: importData.exit_on_goal || null,
        send_time_window: importData.send_time_window || null,
        max_emails_per_day: importData.max_emails_per_day || 3,
        is_public: false, // Always private when imported
        is_active: true
      };

      return await this.createTemplate(templateData, currentUser);
    } catch (error) {
      console.error('Error importing workflow template:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to import workflow template', 500);
    }
  }

  /**
   * Get template packs
   */
  async getTemplatePacks(filters = {}) {
    try {
      let query = supabaseAdmin
        .from('workflow_template_packs')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich packs with template details
      const enrichedPacks = await Promise.all(
        (data || []).map(async (pack) => {
          if (pack.template_ids && pack.template_ids.length > 0) {
            const { data: templates } = await supabaseAdmin
              .from('workflow_templates')
              .select('id, name, description, category')
              .in('id', pack.template_ids);
            pack.templates = templates || [];
          }
          return pack;
        })
      );

      return enrichedPacks;
    } catch (error) {
      console.error('Error fetching template packs:', error);
      throw new ApiError('Failed to fetch template packs', 500);
    }
  }

  /**
   * Get pack by ID
   */
  async getPackById(packId) {
    try {
      const { data: pack, error } = await supabaseAdmin
        .from('workflow_template_packs')
        .select('*')
        .eq('id', packId)
        .eq('is_active', true)
        .single();

      if (error || !pack) {
        throw new ApiError('Template pack not found', 404);
      }

      // Get templates in pack
      if (pack.template_ids && pack.template_ids.length > 0) {
        const { data: templates } = await supabaseAdmin
          .from('workflow_templates')
          .select('*')
          .in('id', pack.template_ids);
        pack.templates = templates || [];
      }

      return pack;
    } catch (error) {
      console.error('Error fetching template pack:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch template pack', 500);
    }
  }
}

module.exports = new WorkflowTemplateService();

