const emailSendService = require('../services/emailSendService');
const ApiError = require('../utils/ApiError');

/**
 * Email Send Controller
 * Handles sending emails and managing suppression list
 */
class EmailSendController {
  /**
   * Send email to a lead
   * POST /api/email/send/lead
   */
  async sendToLead(req, res, next) {
    try {
      const { lead_id, template_version_id, custom_data } = req.body;

      if (!lead_id || !template_version_id) {
        throw new ApiError('lead_id and template_version_id are required', 400);
      }

      const result = await emailSendService.sendToLead(
        lead_id,
        template_version_id,
        custom_data || {},
        req.user
      );

      res.json({
        success: true,
        data: result,
        message: 'Email sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send email to custom recipient
   * POST /api/email/send/custom
   */
  async sendToEmail(req, res, next) {
    try {
      const { email, name, template_version_id, custom_data } = req.body;

      if (!email || !template_version_id) {
        throw new ApiError('email and template_version_id are required', 400);
      }

      const result = await emailSendService.sendToEmail(
        email,
        name,
        template_version_id,
        custom_data || {},
        req.user
      );

      res.json({
        success: true,
        data: result,
        message: 'Email sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sent emails (outbound messages)
   * GET /api/email/sent
   */
  async getSentEmails(req, res, next) {
    try {
      const { lead_id, template_id, status, page = 1, limit = 20 } = req.query;

      const { supabaseAdmin } = require('../config/supabase');
      
      let query = supabaseAdmin
        .from('outbound_messages')
        .select('*, lead:leads(id, name, email), template:email_templates(id, name)', { count: 'exact' })
        .eq('company_id', req.user.company_id);

      if (lead_id) query = query.eq('lead_id', lead_id);
      if (template_id) query = query.eq('template_id', template_id);
      if (status) query = query.eq('status', status);

      const offset = (page - 1) * limit;
      query = query
        .range(offset, offset + parseInt(limit) - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get email details
   * GET /api/email/sent/:id
   */
  async getEmailDetails(req, res, next) {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = require('../config/supabase');

      const { data, error } = await supabaseAdmin
        .from('outbound_messages')
        .select('*, lead:leads(id, name, email), template:email_templates(id, name)')
        .eq('id', id)
        .eq('company_id', req.user.company_id)
        .single();

      if (error || !data) {
        throw new ApiError('Email not found', 404);
      }

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get suppression list
   * GET /api/email/suppression
   */
  async getSuppressionList(req, res, next) {
    try {
      const { reason, page = 1, limit = 50 } = req.query;
      const { supabaseAdmin } = require('../config/supabase');

      let query = supabaseAdmin
        .from('email_suppression_list')
        .select('*', { count: 'exact' })
        .eq('company_id', req.user.company_id);

      if (reason) query = query.eq('reason', reason);

      const offset = (page - 1) * limit;
      query = query
        .range(offset, offset + parseInt(limit) - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add email to suppression list
   * POST /api/email/suppression
   */
  async addToSuppressionList(req, res, next) {
    try {
      const { email, reason, notes } = req.body;

      if (!email || !reason) {
        throw new ApiError('email and reason are required', 400);
      }

      const validReasons = ['unsubscribed', 'bounced', 'spam_complaint', 'manual'];
      if (!validReasons.includes(reason)) {
        throw new ApiError(`Invalid reason. Must be one of: ${validReasons.join(', ')}`, 400);
      }

      const result = await emailSendService.addToSuppressionList(
        email,
        req.user.company_id,
        reason,
        'manual',
        notes || null
      );

      res.json({
        success: true,
        data: result,
        message: result.already_exists ? 'Email already in suppression list' : 'Email added to suppression list'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove email from suppression list
   * DELETE /api/email/suppression/:email
   */
  async removeFromSuppressionList(req, res, next) {
    try {
      const { email } = req.params;
      const { supabaseAdmin } = require('../config/supabase');

      const { error } = await supabaseAdmin
        .from('email_suppression_list')
        .delete()
        .eq('company_id', req.user.company_id)
        .eq('email', email.toLowerCase());

      if (error) throw error;

      res.json({
        success: true,
        message: 'Email removed from suppression list'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailSendController();

