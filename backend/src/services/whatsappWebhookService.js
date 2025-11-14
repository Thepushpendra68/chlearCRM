const whatsappMetaService = require('./whatsappMetaService');
const { supabaseAdmin } = require('../config/supabase');
const whatsappSendService = require('./whatsappSendService');
const whatsappAiService = require('./whatsappAiService');
const leadService = require('./leadService');
const activityService = require('./activityService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Webhook Service
 * Handles incoming webhooks from Meta WhatsApp Business API
 */
class WhatsAppWebhookService {
  /**
   * Process webhook event from Meta
   * @param {string} companyId - Company ID (determined from phone_number_id)
   * @param {object} event - Webhook event payload
   * @returns {object} Processing result
   */
  async processWebhook(companyId, event) {
    try {
      const entry = event.entry?.[0];
      if (!entry) {
        return { success: false, reason: 'invalid_entry' };
      }

      const changes = entry.changes?.[0];
      if (!changes || changes.field !== 'messages') {
        return { success: false, reason: 'not_message_event' };
      }

      const value = changes.value;

      // Handle status updates (sent, delivered, read, failed)
      if (value.statuses) {
        return await this.handleStatusUpdate(companyId, value.statuses);
      }

      // Handle incoming messages
      if (value.messages) {
        return await this.handleIncomingMessages(companyId, value.messages, value.contacts);
      }

      return { success: true, reason: 'no_action_needed' };
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  /**
   * Handle status updates (delivered, read, failed)
   */
  async handleStatusUpdate(companyId, statuses) {
    try {
      for (const status of statuses) {
        const { data: message, error } = await supabaseAdmin
          .from('whatsapp_messages')
          .select('*')
          .eq('provider_message_id', status.id)
          .eq('company_id', companyId)
          .single();

        if (error || !message) {
          console.warn('Message not found for status update:', status.id);
          continue;
        }

        const updates = {
          status: status.status.toLowerCase(),
          updated_at: new Date().toISOString()
        };

        if (status.status === 'delivered' && status.timestamp) {
          updates.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
        }

        if (status.status === 'read' && status.timestamp) {
          updates.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
        }

        if (status.status === 'failed') {
          updates.error_code = status.errors?.[0]?.code;
          updates.error_message = status.errors?.[0]?.title || status.errors?.[0]?.message;
        }

        await supabaseAdmin
          .from('whatsapp_messages')
          .update(updates)
          .eq('id', message.id);
      }

      return { success: true, processed: statuses.length };
    } catch (error) {
      console.error('Error handling status update:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages
   */
  async handleIncomingMessages(companyId, messages, contacts) {
    try {
      const results = [];

      for (const message of messages) {
        const contact = contacts?.find(c => c.wa_id === message.from);

        // Save incoming message
        const { data: savedMessage, error: saveError } = await supabaseAdmin
          .from('whatsapp_messages')
          .insert({
            company_id: companyId,
            provider_message_id: message.id,
            whatsapp_id: message.from,
            direction: 'inbound',
            message_type: message.type,
            content: message.text?.body || message.caption || null,
            media_id: message.image?.id || message.video?.id || message.audio?.id || message.document?.id || null,
            media_caption: message.caption || null,
            status: 'delivered',
            delivered_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
            metadata: { full_payload: message }
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving incoming message:', saveError);
          continue;
        }

        // Find or create lead/contact
        const context = await this.findOrCreateContact(companyId, message.from, contact);

        // Update message with lead/contact info
        if (context.lead_id || context.contact_id) {
          await supabaseAdmin
            .from('whatsapp_messages')
            .update({
              lead_id: context.lead_id,
              contact_id: context.contact_id,
              account_id: context.account_id
            })
            .eq('id', savedMessage.id);
        }

        // Log as activity
        if (context.lead_id || context.contact_id) {
          await whatsappSendService.logActivity(companyId, savedMessage, context);
        }

        // Update conversation
        await whatsappSendService.updateConversation(companyId, message.from, 'inbound', context);

        // Mark message as read (auto-acknowledge)
        try {
          await whatsappMetaService.markAsRead(companyId, message.id);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }

        // Process with AI chatbot if message is text or interactive response
        if (message.type === 'text' && message.text?.body) {
          try {
            const autoReplyEnabled = await whatsappAiService.isAutoReplyEnabled(companyId);
            
            if (autoReplyEnabled) {
              console.log(`[WhatsApp Webhook] Processing message with AI: ${message.text.body.substring(0, 50)}...`);
              
              await whatsappAiService.processIncomingMessage(
                companyId,
                message.from,
                message.text.body,
                {
                  lead_id: context.lead_id,
                  contact_id: context.contact_id,
                  account_id: context.account_id,
                  whatsapp_message_id: savedMessage.id
                },
                {
                  autoReply: true,
                  language: null // Auto-detect
                }
              );
            } else {
              console.log('[WhatsApp Webhook] Auto-reply is disabled for this company');
            }
          } catch (aiError) {
            console.error('[WhatsApp Webhook] Error processing message with AI:', aiError);
            // Don't fail the webhook if AI processing fails
            // Message is already saved and logged
          }
        } else if (message.type === 'interactive' && message.interactive) {
          // Handle interactive message responses (button clicks, list selections)
          try {
            const interactive = message.interactive;
            let responseText = '';
            
            if (interactive.type === 'button_reply') {
              responseText = interactive.button_reply?.title || '';
              console.log(`[WhatsApp Webhook] Button clicked: ${responseText}`);
            } else if (interactive.type === 'list_reply') {
              responseText = interactive.list_reply?.title || '';
              const listId = interactive.list_reply?.id || '';
              console.log(`[WhatsApp Webhook] List item selected: ${responseText} (ID: ${listId})`);
            }
            
            // Process interactive response with AI
            if (responseText) {
              const autoReplyEnabled = await whatsappAiService.isAutoReplyEnabled(companyId);
              if (autoReplyEnabled) {
                await whatsappAiService.processIncomingMessage(
                  companyId,
                  message.from,
                  responseText,
                  {
                    lead_id: context.lead_id,
                    contact_id: context.contact_id,
                    account_id: context.account_id,
                    whatsapp_message_id: savedMessage.id,
                    interactive_response: true
                  },
                  {
                    autoReply: true,
                    language: null
                  }
                );
              }
            }
          } catch (aiError) {
            console.error('[WhatsApp Webhook] Error processing interactive response:', aiError);
          }
        }

        results.push({ messageId: savedMessage.id, context });
      }

      return { success: true, processed: results.length, results };
    } catch (error) {
      console.error('Error handling incoming messages:', error);
      throw error;
    }
  }

  /**
   * Find existing contact or create lead from WhatsApp number
   */
  async findOrCreateContact(companyId, whatsappId, contactInfo) {
    try {
      // Normalize phone for search
      const normalizedPhone = whatsappMetaService.normalizePhoneNumber(whatsappId);
      
      // Try to find existing contact by phone
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id, lead_id, account_id')
        .eq('company_id', companyId)
        .or(`phone.eq.${normalizedPhone},mobile_phone.eq.${normalizedPhone}`)
        .limit(1)
        .maybeSingle();

      if (contact) {
        return {
          contact_id: contact.id,
          lead_id: contact.lead_id,
          account_id: contact.account_id
        };
      }

      // Try to find lead by phone
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, account_id')
        .eq('company_id', companyId)
        .or(`phone.eq.${normalizedPhone},mobile_phone.eq.${normalizedPhone}`)
        .limit(1)
        .maybeSingle();

      if (lead) {
        return {
          lead_id: lead.id,
          account_id: lead.account_id
        };
      }

      // Create new lead from WhatsApp message
      const leadData = {
        company_id: companyId,
        first_name: contactInfo?.profile?.name?.split(' ')[0] || 'WhatsApp',
        last_name: contactInfo?.profile?.name?.split(' ').slice(1).join(' ') || 'Contact',
        phone: normalizedPhone,
        mobile_phone: normalizedPhone,
        source: 'whatsapp',
        status: 'new',
        priority: 'medium',
        notes: `Lead captured via WhatsApp. Profile name: ${contactInfo?.profile?.name || 'Unknown'}`
      };

      const newLead = await leadService.createLead(leadData, {
        id: null, // System user
        company_id: companyId
      });

      return {
        lead_id: newLead.id
      };
    } catch (error) {
      console.error('Error finding/creating contact:', error);
      return {};
    }
  }
}

module.exports = new WhatsAppWebhookService();

