const whatsappMetaService = require('./whatsappMetaService');
const { supabaseAdmin } = require('../config/supabase');
const activityService = require('./activityService');
const leadService = require('./leadService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Send Service
 * Handles sending WhatsApp messages and logging to database
 */
class WhatsAppSendService {
  /**
   * Send text message to WhatsApp number
   * @param {string} companyId - Company ID
   * @param {string} to - WhatsApp ID
   * @param {string} message - Message text
   * @param {object} context - Context (lead_id, contact_id, user_id)
   * @returns {object} Sent message record
   */
  async sendTextMessage(companyId, to, message, context = {}) {
    try {
      // Send via Meta API
      const result = await whatsappMetaService.sendTextMessage(companyId, to, message);

      // Save to database
      const { data: messageRecord, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          company_id: companyId,
          provider_message_id: result.messageId,
          whatsapp_id: to,
          direction: 'outbound',
          message_type: 'text',
          content: message,
          lead_id: context.lead_id || null,
          contact_id: context.contact_id || null,
          account_id: context.account_id || null,
          user_id: context.user_id || null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: { api_response: result.data }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving WhatsApp message:', error);
        // Don't throw - message was sent successfully
      }

      // Log as activity if lead/contact exists
      if (context.lead_id || context.contact_id) {
        await this.logActivity(companyId, messageRecord, context);
      }

      // Update conversation
      await this.updateConversation(companyId, to, 'outbound', context);

      return {
        success: true,
        message: messageRecord,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to send WhatsApp message', 500);
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(companyId, to, templateName, language, parameters, context = {}) {
    try {
      const result = await whatsappMetaService.sendTemplateMessage(
        companyId,
        to,
        templateName,
        language,
        parameters
      );

      const { data: messageRecord, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          company_id: companyId,
          provider_message_id: result.messageId,
          whatsapp_id: to,
          direction: 'outbound',
          message_type: 'template',
          template_name: templateName,
          template_language: language,
          template_params: parameters,
          lead_id: context.lead_id || null,
          contact_id: context.contact_id || null,
          account_id: context.account_id || null,
          user_id: context.user_id || null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: { api_response: result.data }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving WhatsApp template message:', error);
      }

      if (context.lead_id || context.contact_id) {
        await this.logActivity(companyId, messageRecord, context);
      }

      await this.updateConversation(companyId, to, 'outbound', context);

      return {
        success: true,
        message: messageRecord,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to send WhatsApp template message', 500);
    }
  }

  /**
   * Log WhatsApp message as activity
   */
  async logActivity(companyId, messageRecord, context) {
    try {
      const activityData = {
        company_id: companyId,
        lead_id: context.lead_id || null,
        contact_id: context.contact_id || null,
        account_id: context.account_id || null,
        user_id: context.user_id || null,
        activity_type: 'whatsapp',
        subject: `WhatsApp message ${messageRecord.direction === 'outbound' ? 'sent' : 'received'}`,
        description: messageRecord.content || `Template: ${messageRecord.template_name}`,
        is_completed: true,
        completed_at: new Date().toISOString(),
        metadata: {
          whatsapp_message_id: messageRecord.id,
          provider_message_id: messageRecord.provider_message_id,
          message_type: messageRecord.message_type
        }
      };

      await activityService.createActivity(activityData, {
        id: context.user_id,
        company_id: companyId
      });
    } catch (error) {
      console.error('Error logging WhatsApp activity:', error);
      // Don't throw - activity logging failure shouldn't break message sending
    }
  }

  /**
   * Update or create conversation
   */
  async updateConversation(companyId, whatsappId, direction, context) {
    try {
      const { data: existing } = await supabaseAdmin
        .from('whatsapp_conversations')
        .select('id, message_count, unread_count')
        .eq('company_id', companyId)
        .eq('whatsapp_id', whatsappId)
        .single();

      if (existing) {
        await supabaseAdmin
          .from('whatsapp_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_direction: direction,
            message_count: existing.message_count + 1,
            unread_count: direction === 'inbound' ? (existing.unread_count || 0) + 1 : existing.unread_count,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabaseAdmin
          .from('whatsapp_conversations')
          .insert({
            company_id: companyId,
            whatsapp_id: whatsappId,
            lead_id: context.lead_id || null,
            contact_id: context.contact_id || null,
            account_id: context.account_id || null,
            last_message_at: new Date().toISOString(),
            last_message_direction: direction,
            message_count: 1,
            unread_count: direction === 'inbound' ? 1 : 0,
            is_active: true
          });
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      // Don't throw
    }
  }
}

module.exports = new WhatsAppSendService();

