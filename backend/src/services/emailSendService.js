const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const emailTemplateService = require('./emailTemplateService');
const postmark = require('postmark');
const validator = require('validator');

/**
 * Email Send Service
 * Handles sending emails via provider (Postmark) and tracking
 */
class EmailSendService {
  constructor() {
    this.providers = new Map();
  }

  /**
   * Get email provider client for company
   */
  async getProviderClient(companyId) {
    try {
      // Check cache first
      const cacheKey = `email_${companyId}`;
      if (this.providers.has(cacheKey)) {
        return this.providers.get(cacheKey);
      }

      // Get integration settings
      const { data: settings, error } = await supabaseAdmin
        .from('integration_settings')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', 'email')
        .eq('is_active', true)
        .single();

      if (error || !settings) {
        throw new ApiError('Email integration not configured. Please set up email provider in settings.', 400);
      }

      // Create provider client
      let client;
      switch (settings.provider) {
        case 'postmark':
          if (!settings.config.api_key) {
            throw new ApiError('Postmark API key not configured', 400);
          }
          client = new postmark.ServerClient(settings.config.api_key);
          break;
        
        // Add other providers here (SendGrid, SES, etc.)
        default:
          throw new ApiError(`Unsupported email provider: ${settings.provider}`, 400);
      }

      // Cache the client
      this.providers.set(cacheKey, { client, settings });

      return { client, settings };
    } catch (error) {
      console.error('Error getting email provider:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to initialize email provider', 500);
    }
  }

  /**
   * Send email to a lead
   */
  async sendToLead(leadId, templateVersionId, customData = {}, currentUser) {
    try {
      // Get lead
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*, custom_fields')
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (leadError || !lead) {
        throw new ApiError('Lead not found', 404);
      }

      if (!lead.email || !validator.isEmail(lead.email)) {
        throw new ApiError('Lead does not have a valid email address', 400);
      }

      // Check suppression list
      const isSuppressed = await this.checkSuppressionList(lead.email, currentUser.company_id);
      if (isSuppressed) {
        throw new ApiError('Email address is in suppression list (unsubscribed or bounced)', 400);
      }

      // Prepare template data
      const templateData = {
        lead: {
          id: lead.id,
          name: lead.name,
          first_name: lead.first_name || lead.name.split(' ')[0],
          last_name: lead.last_name || lead.name.split(' ').slice(1).join(' '),
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          title: lead.title,
          status: lead.status,
          source: lead.source,
          deal_value: lead.deal_value,
          priority: lead.priority
        },
        custom_fields: lead.custom_fields || {},
        ...customData
      };

      // Render template
      const rendered = await emailTemplateService.renderTemplate(
        templateVersionId,
        templateData,
        currentUser
      );

      // Get provider
      const { client, settings } = await this.getProviderClient(currentUser.company_id);

      // Get template version for tracking
      const { data: version } = await supabaseAdmin
        .from('email_template_versions')
        .select('template_id')
        .eq('id', templateVersionId)
        .single();

      // Send via provider
      const result = await this.sendViaProvider(client, settings, {
        to: lead.email,
        to_name: lead.name,
        from_email: rendered.from_email || settings.config.from_email,
        from_name: rendered.from_name || settings.config.from_name || 'CRM',
        reply_to: rendered.reply_to || settings.config.reply_to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        track_opens: true,
        track_clicks: true,
        metadata: {
          lead_id: leadId,
          template_version_id: templateVersionId,
          company_id: currentUser.company_id
        }
      });

      // Log outbound message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('outbound_messages')
        .insert({
          company_id: currentUser.company_id,
          lead_id: leadId,
          template_id: version?.template_id || null,
          template_version_id: templateVersionId,
          to_email: lead.email,
          to_name: lead.name,
          subject: rendered.subject,
          html: rendered.html,
          text_version: rendered.text,
          provider: settings.provider,
          provider_message_id: result.message_id,
          status: 'sent',
          metrics: {
            sent_at: new Date().toISOString()
          },
          created_by: currentUser.id
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error logging outbound message:', messageError);
      }

      // Log activity
      await supabaseAdmin.from('activities').insert({
        company_id: currentUser.company_id,
        lead_id: leadId,
        user_id: currentUser.id,
        type: 'email',
        description: `Sent email: ${rendered.subject}`,
        metadata: {
          message_id: message?.id,
          provider_message_id: result.message_id,
          subject: rendered.subject
        }
      });

      return {
        success: true,
        message_id: message?.id,
        provider_message_id: result.message_id
      };
    } catch (error) {
      console.error('Error sending email to lead:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send email', 500);
    }
  }

  /**
   * Send email to custom recipient
   */
  async sendToEmail(email, name, templateVersionId, customData = {}, currentUser) {
    try {
      if (!validator.isEmail(email)) {
        throw new ApiError('Invalid email address', 400);
      }

      // Check suppression list
      const isSuppressed = await this.checkSuppressionList(email, currentUser.company_id);
      if (isSuppressed) {
        throw new ApiError('Email address is in suppression list', 400);
      }

      // Prepare template data
      const templateData = {
        recipient: {
          email: email,
          name: name || email,
          first_name: name ? name.split(' ')[0] : email
        },
        ...customData
      };

      // Render template
      const rendered = await emailTemplateService.renderTemplate(
        templateVersionId,
        templateData,
        currentUser
      );

      // Get provider
      const { client, settings } = await this.getProviderClient(currentUser.company_id);

      // Get template version
      const { data: version } = await supabaseAdmin
        .from('email_template_versions')
        .select('template_id')
        .eq('id', templateVersionId)
        .single();

      // Send via provider
      const result = await this.sendViaProvider(client, settings, {
        to: email,
        to_name: name || email,
        from_email: rendered.from_email || settings.config.from_email,
        from_name: rendered.from_name || settings.config.from_name || 'CRM',
        reply_to: rendered.reply_to || settings.config.reply_to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        track_opens: true,
        track_clicks: true,
        metadata: {
          template_version_id: templateVersionId,
          company_id: currentUser.company_id
        }
      });

      // Log outbound message
      const { data: message } = await supabaseAdmin
        .from('outbound_messages')
        .insert({
          company_id: currentUser.company_id,
          lead_id: null,
          template_id: version?.template_id || null,
          template_version_id: templateVersionId,
          to_email: email,
          to_name: name || email,
          subject: rendered.subject,
          html: rendered.html,
          text_version: rendered.text,
          provider: settings.provider,
          provider_message_id: result.message_id,
          status: 'sent',
          metrics: {
            sent_at: new Date().toISOString()
          },
          created_by: currentUser.id
        })
        .select()
        .single();

      return {
        success: true,
        message_id: message?.id,
        provider_message_id: result.message_id
      };
    } catch (error) {
      console.error('Error sending email:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send email', 500);
    }
  }

  /**
   * Send email via provider (Postmark)
   */
  async sendViaProvider(client, settings, emailData) {
    try {
      if (settings.provider === 'postmark') {
        const result = await client.sendEmail({
          From: `${emailData.from_name} <${emailData.from_email}>`,
          To: emailData.to_name ? `${emailData.to_name} <${emailData.to}>` : emailData.to,
          ReplyTo: emailData.reply_to || emailData.from_email,
          Subject: emailData.subject,
          HtmlBody: emailData.html,
          TextBody: emailData.text,
          TrackOpens: emailData.track_opens || false,
          TrackLinks: emailData.track_clicks ? 'HtmlAndText' : 'None',
          Metadata: emailData.metadata || {}
        });

        return {
          message_id: result.MessageID,
          status: 'sent'
        };
      }

      // Add other providers here
      throw new ApiError('Provider not implemented', 500);
    } catch (error) {
      console.error('Error sending via provider:', error);
      throw new ApiError(`Failed to send via ${settings.provider}: ${error.message}`, 500);
    }
  }

  /**
   * Check if email is in suppression list
   */
  async checkSuppressionList(email, companyId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_suppression_list')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', email.toLowerCase())
        .single();

      return !!data;
    } catch (error) {
      // If not found, return false
      return false;
    }
  }

  /**
   * Add email to suppression list
   */
  async addToSuppressionList(email, companyId, reason, source = 'manual', notes = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_suppression_list')
        .insert({
          company_id: companyId,
          email: email.toLowerCase(),
          reason: reason,
          source: source,
          notes: notes
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already exists
          return { success: true, already_exists: true };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding to suppression list:', error);
      throw new ApiError('Failed to add to suppression list', 500);
    }
  }

  /**
   * Process webhook event from provider
   */
  async processWebhook(provider, eventData) {
    try {
      if (provider === 'postmark') {
        return await this.processPostmarkWebhook(eventData);
      }

      throw new ApiError('Unknown provider', 400);
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Process Postmark webhook
   */
  async processPostmarkWebhook(event) {
    try {
      const messageId = event.MessageID;

      // Find message by provider ID
      const { data: message, error } = await supabaseAdmin
        .from('outbound_messages')
        .select('*')
        .eq('provider_message_id', messageId)
        .single();

      if (error || !message) {
        console.warn('Message not found for webhook:', messageId);
        return { success: false, reason: 'message_not_found' };
      }

      const updates = { ...message.metrics };

      // Update based on event type
      switch (event.RecordType) {
        case 'Delivery':
          updates.delivered_at = event.DeliveredAt;
          await supabaseAdmin
            .from('outbound_messages')
            .update({
              status: 'delivered',
              metrics: updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id);
          break;

        case 'Bounce':
          updates.bounced_at = event.BouncedAt;
          updates.bounce_type = event.Type;
          updates.bounce_description = event.Description;
          await supabaseAdmin
            .from('outbound_messages')
            .update({
              status: 'bounced',
              error_message: event.Description,
              metrics: updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id);

          // Add to suppression list for hard bounces
          if (event.Type === 'HardBounce') {
            await this.addToSuppressionList(
              message.to_email,
              message.company_id,
              'bounced',
              'webhook',
              `Hard bounce: ${event.Description}`
            );
          }
          break;

        case 'Open':
          updates.opened_at = updates.opened_at || event.ReceivedAt;
          updates.opened_count = (updates.opened_count || 0) + 1;
          updates.last_opened_at = event.ReceivedAt;
          await supabaseAdmin
            .from('outbound_messages')
            .update({
              metrics: updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id);
          break;

        case 'Click':
          updates.clicked_at = updates.clicked_at || event.ReceivedAt;
          updates.clicked_count = (updates.clicked_count || 0) + 1;
          updates.last_clicked_at = event.ReceivedAt;
          updates.links_clicked = updates.links_clicked || [];
          if (event.OriginalLink && !updates.links_clicked.includes(event.OriginalLink)) {
            updates.links_clicked.push(event.OriginalLink);
          }
          await supabaseAdmin
            .from('outbound_messages')
            .update({
              metrics: updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id);
          break;

        case 'SpamComplaint':
          updates.spam_complaint_at = event.BouncedAt;
          await supabaseAdmin
            .from('outbound_messages')
            .update({
              metrics: updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id);

          // Add to suppression list
          await this.addToSuppressionList(
            message.to_email,
            message.company_id,
            'spam_complaint',
            'webhook',
            'User marked email as spam'
          );
          break;
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing Postmark webhook:', error);
      throw error;
    }
  }
}

module.exports = new EmailSendService();

