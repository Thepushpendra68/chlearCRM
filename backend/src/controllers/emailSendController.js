const emailSendService = require('../services/emailSendService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Email Send Controller
 * Handles sending emails and managing suppression list
 * Extends BaseController for standardized patterns
 */
class EmailSendController extends BaseController {
  /**
   * Send email to a lead
   * POST /api/email/send/lead
   */
  sendToLead = asyncHandler(async (req, res) => {
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

    this.success(res, result, 200, 'Email sent successfully');
  });

  /**
   * Send email to custom recipient
   * POST /api/email/send/custom
   */
  sendToEmail = asyncHandler(async (req, res) => {
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

    this.success(res, result, 200, 'Email sent successfully');
  });

  /**
   * Get sent emails (outbound messages)
   * GET /api/email/sent
   */
  getSentEmails = asyncHandler(async (req, res) => {
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

    this.paginated(res, data, parseInt(page), parseInt(limit), count, 200);
  });

  /**
   * Get email details
   * GET /api/email/sent/:id
   */
  getEmailDetails = asyncHandler(async (req, res) => {
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

    this.success(res, data, 200);
  });

  /**
   * Get suppression list
   * GET /api/email/suppression
   */
  getSuppressionList = asyncHandler(async (req, res) => {
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

    this.paginated(res, data, parseInt(page), parseInt(limit), count, 200);
  });

  /**
   * Add email to suppression list
   * POST /api/email/suppression
   */
  addToSuppressionList = asyncHandler(async (req, res) => {
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

    this.success(res, result, 200, result.already_exists ? 'Email already in suppression list' : 'Email added to suppression list');
  });

  /**
   * Remove email from suppression list
   * DELETE /api/email/suppression/:email
   */
  removeFromSuppressionList = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const { supabaseAdmin } = require('../config/supabase');

    const { error } = await supabaseAdmin
      .from('email_suppression_list')
      .delete()
      .eq('company_id', req.user.company_id)
      .eq('email', email.toLowerCase());

    if (error) throw error;

    this.success(res, null, 200, 'Email removed from suppression list');
  });
}

module.exports = new EmailSendController();

