const whatsappSendService = require('../services/whatsappSendService');
const whatsappMetaService = require('../services/whatsappMetaService');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Controller
 * Handles WhatsApp API endpoints
 */
class WhatsAppController {
  /**
   * Send text message
   * POST /api/whatsapp/send/text
   */
  async sendTextMessage(req, res, next) {
    try {
      const { to, message, lead_id, contact_id, account_id } = req.body;

      if (!to || !message) {
        throw new ApiError('Phone number and message are required', 400);
      }

      const result = await whatsappSendService.sendTextMessage(
        req.user.company_id,
        to,
        message,
        {
          lead_id,
          contact_id,
          account_id,
          user_id: req.user.id
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send template message
   * POST /api/whatsapp/send/template
   */
  async sendTemplateMessage(req, res, next) {
    try {
      const { to, template_name, language, parameters, lead_id, contact_id, account_id } = req.body;

      if (!to || !template_name) {
        throw new ApiError('Phone number and template name are required', 400);
      }

      const result = await whatsappSendService.sendTemplateMessage(
        req.user.company_id,
        to,
        template_name,
        language || 'en',
        parameters || [],
        {
          lead_id,
          contact_id,
          account_id,
          user_id: req.user.id
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get messages
   * GET /api/whatsapp/messages
   */
  async getMessages(req, res, next) {
    try {
      const { lead_id, contact_id, whatsapp_id, limit = 50, page = 1 } = req.query;

      let query = supabaseAdmin
        .from('whatsapp_messages')
        .select('*')
        .eq('company_id', req.user.company_id)
        .order('created_at', { ascending: false });

      if (lead_id) query = query.eq('lead_id', lead_id);
      if (contact_id) query = query.eq('contact_id', contact_id);
      if (whatsapp_id) query = query.eq('whatsapp_id', whatsapp_id);

      const offset = (page - 1) * limit;
      const { data, error } = await query.range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get templates from Meta
   * GET /api/whatsapp/templates
   */
  async getTemplates(req, res, next) {
    try {
      const result = await whatsappMetaService.getTemplates(req.user.company_id);

      res.json({
        success: true,
        data: result.templates
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get integration settings
   * GET /api/whatsapp/settings
   */
  async getSettings(req, res, next) {
    try {
      const { data, error } = await supabaseAdmin
        .from('integration_settings')
        .select('*')
        .eq('company_id', req.user.company_id)
        .eq('type', 'whatsapp')
        .eq('provider', 'meta')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      res.json({
        success: true,
        data: data || null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update integration settings
   * POST /api/whatsapp/settings
   */
  async updateSettings(req, res, next) {
    try {
      const { access_token, phone_number_id, business_account_id, app_secret } = req.body;

      if (!access_token || !phone_number_id) {
        throw new ApiError('Access token and phone number ID are required', 400);
      }

      const config = {
        access_token,
        phone_number_id,
        business_account_id,
        app_secret
      };

      const { data: existing } = await supabaseAdmin
        .from('integration_settings')
        .select('id')
        .eq('company_id', req.user.company_id)
        .eq('type', 'whatsapp')
        .eq('provider', 'meta')
        .maybeSingle();

      const payload = {
        company_id: req.user.company_id,
        type: 'whatsapp',
        provider: 'meta',
        config,
        is_active: true,
        created_by: req.user.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existing) {
        const { data, error } = await supabaseAdmin
          .from('integration_settings')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from('integration_settings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Clear cache
      whatsappMetaService.clearCache(req.user.company_id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WhatsAppController();

