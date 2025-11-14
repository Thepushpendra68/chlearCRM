const { supabaseAdmin } = require('../config/supabase');
const whatsappSendService = require('./whatsappSendService');
const whatsappMetaService = require('./whatsappMetaService');
const leadService = require('./leadService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Broadcast Service
 * Handles bulk/broadcast messaging to multiple recipients
 */
class WhatsAppBroadcastService {
  /**
   * Create a new broadcast
   * @param {string} companyId - Company ID
   * @param {object} broadcastData - Broadcast configuration
   * @returns {object} Created broadcast
   */
  async createBroadcast(companyId, broadcastData) {
    try {
      const {
        name,
        description,
        message_type,
        content,
        template_name,
        template_language,
        template_params,
        media_type,
        media_url,
        media_caption,
        recipient_type,
        recipient_ids,
        recipient_filters,
        scheduled_at,
        send_time_window,
        messages_per_minute = 10,
        batch_size = 10
      } = broadcastData;

      // Validate required fields
      if (!name || !message_type) {
        throw new ApiError('Name and message type are required', 400);
      }

      // Resolve recipients
      const recipients = await this.resolveRecipients(
        companyId,
        recipient_type,
        recipient_ids,
        recipient_filters
      );

      if (recipients.length === 0) {
        throw new ApiError('No recipients found for broadcast', 400);
      }

      // Create broadcast record
      const { data: broadcast, error } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .insert({
          company_id: companyId,
          name,
          description,
          message_type,
          content,
          template_name,
          template_language: template_language || 'en',
          template_params: template_params || [],
          media_type,
          media_url,
          media_caption,
          recipient_type,
          recipient_ids: recipient_type === 'custom' ? recipient_ids : null,
          recipient_filters: recipient_type === 'filter' ? recipient_filters : null,
          recipient_count: recipients.length,
          scheduled_at: scheduled_at || null,
          send_time_window,
          messages_per_minute,
          batch_size,
          status: scheduled_at ? 'scheduled' : 'draft',
          progress: { sent: 0, delivered: 0, read: 0, failed: 0 },
          created_by: broadcastData.created_by || null,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Create recipient records
      await this.createRecipientRecords(broadcast.id, recipients);

      return {
        success: true,
        broadcast
      };
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to create broadcast', 500);
    }
  }

  /**
   * Resolve recipients based on type
   * @param {string} companyId - Company ID
   * @param {string} recipientType - Type of recipients
   * @param {array} recipientIds - Custom IDs (for 'custom' type)
   * @param {object} filters - Filter criteria (for 'filter' type)
   * @returns {array} Array of recipient objects with whatsapp_id, lead_id, contact_id
   */
  async resolveRecipients(companyId, recipientType, recipientIds, filters) {
    const recipients = [];

    try {
      switch (recipientType) {
        case 'leads':
          // Get all leads with phone numbers
          const { data: leads, error: leadsError } = await supabaseAdmin
            .from('leads')
            .select('id, phone, name')
            .eq('company_id', companyId)
            .not('phone', 'is', null)
            .neq('phone', '');

          if (leadsError) throw leadsError;

          recipients.push(...leads.map(lead => ({
            whatsapp_id: this.normalizePhoneNumber(lead.phone),
            lead_id: lead.id,
            contact_id: null
          })));
          break;

        case 'contacts':
          // Get all contacts with phone numbers
          const { data: contacts, error: contactsError } = await supabaseAdmin
            .from('contacts')
            .select('id, phone, mobile_phone, lead_id, first_name, last_name')
            .eq('company_id', companyId)
            .or('phone.not.is.null,mobile_phone.not.is.null');

          if (contactsError) throw contactsError;

          contacts.forEach(contact => {
            const phone = contact.phone || contact.mobile_phone;
            if (phone) {
              recipients.push({
                whatsapp_id: this.normalizePhoneNumber(phone),
                lead_id: contact.lead_id,
                contact_id: contact.id
              });
            }
          });
          break;

        case 'custom':
          // Use provided recipient IDs
          if (!recipientIds || recipientIds.length === 0) {
            throw new ApiError('Recipient IDs required for custom type', 400);
          }

          // Get leads
          const { data: customLeads, error: customLeadsError } = await supabaseAdmin
            .from('leads')
            .select('id, phone, name')
            .eq('company_id', companyId)
            .in('id', recipientIds.filter(id => id.startsWith('lead_')).map(id => id.replace('lead_', '')))
            .not('phone', 'is', null);

          if (customLeadsError) throw customLeadsError;

          customLeads.forEach(lead => {
            if (lead.phone) {
              recipients.push({
                whatsapp_id: this.normalizePhoneNumber(lead.phone),
                lead_id: lead.id,
                contact_id: null
              });
            }
          });

          // Get contacts
          const contactIds = recipientIds.filter(id => id.startsWith('contact_')).map(id => id.replace('contact_', ''));
          if (contactIds.length > 0) {
            const { data: customContacts, error: customContactsError } = await supabaseAdmin
              .from('contacts')
              .select('id, phone, mobile_phone, lead_id')
              .eq('company_id', companyId)
              .in('id', contactIds)
              .or('phone.not.is.null,mobile_phone.not.is.null');

            if (customContactsError) throw customContactsError;

            customContacts.forEach(contact => {
              const phone = contact.phone || contact.mobile_phone;
              if (phone) {
                recipients.push({
                  whatsapp_id: this.normalizePhoneNumber(phone),
                  lead_id: contact.lead_id,
                  contact_id: contact.id
                });
              }
            });
          }
          break;

        case 'filter':
          // Apply filters to find leads
          if (!filters) {
            throw new ApiError('Filters required for filter type', 400);
          }

          let query = supabaseAdmin
            .from('leads')
            .select('id, phone, name')
            .eq('company_id', companyId)
            .not('phone', 'is', null)
            .neq('phone', '');

          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.source) {
            query = query.eq('source', filters.source);
          }
          if (filters.assigned_to) {
            query = query.eq('assigned_to', filters.assigned_to);
          }
          if (filters.created_after) {
            query = query.gte('created_at', filters.created_after);
          }
          if (filters.created_before) {
            query = query.lte('created_at', filters.created_before);
          }

          const { data: filteredLeads, error: filteredError } = await query;

          if (filteredError) throw filteredError;

          filteredLeads.forEach(lead => {
            if (lead.phone) {
              recipients.push({
                whatsapp_id: this.normalizePhoneNumber(lead.phone),
                lead_id: lead.id,
                contact_id: null
              });
            }
          });
          break;

        default:
          throw new ApiError(`Invalid recipient type: ${recipientType}`, 400);
      }

      // Remove duplicates (same whatsapp_id)
      const uniqueRecipients = [];
      const seen = new Set();
      recipients.forEach(recipient => {
        if (!seen.has(recipient.whatsapp_id)) {
          seen.add(recipient.whatsapp_id);
          uniqueRecipients.push(recipient);
        }
      });

      return uniqueRecipients;
    } catch (error) {
      console.error('Error resolving recipients:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to resolve recipients', 500);
    }
  }

  /**
   * Create recipient records for broadcast
   */
  async createRecipientRecords(broadcastId, recipients) {
    try {
      const records = recipients.map(recipient => ({
        broadcast_id: broadcastId,
        lead_id: recipient.lead_id,
        contact_id: recipient.contact_id,
        whatsapp_id: recipient.whatsapp_id,
        status: 'pending'
      }));

      const { error } = await supabaseAdmin
        .from('whatsapp_broadcast_recipients')
        .insert(records);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating recipient records:', error);
      throw error;
    }
  }

  /**
   * Send broadcast (process all recipients)
   * @param {string} broadcastId - Broadcast ID
   * @returns {object} Send result
   */
  async sendBroadcast(broadcastId) {
    try {
      // Get broadcast
      const { data: broadcast, error: broadcastError } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('*')
        .eq('id', broadcastId)
        .single();

      if (broadcastError) throw broadcastError;

      if (broadcast.status === 'sent' || broadcast.status === 'sending') {
        throw new ApiError('Broadcast already sent or in progress', 400);
      }

      // Update status to sending
      await supabaseAdmin
        .from('whatsapp_broadcasts')
        .update({
          status: 'sending',
          started_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      // Get pending recipients
      const { data: recipients, error: recipientsError } = await supabaseAdmin
        .from('whatsapp_broadcast_recipients')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (recipientsError) throw recipientsError;

      // Process in batches with rate limiting
      const batchSize = broadcast.batch_size || 10;
      const messagesPerMinute = broadcast.messages_per_minute || 10;
      const delayBetweenBatches = (60 / messagesPerMinute) * 1000; // milliseconds

      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        // Process batch
        const batchPromises = batch.map(recipient =>
          this.sendToRecipient(broadcast, recipient)
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // Update recipient statuses
        for (let j = 0; j < batch.length; j++) {
          const recipient = batch[j];
          const result = batchResults[j];

          if (result.status === 'fulfilled' && result.value.success) {
            await this.updateRecipientStatus(
              recipient.id,
              'sent',
              result.value.messageId,
              null,
              null
            );
            sentCount++;
          } else {
            const error = result.reason || result.value?.error;
            await this.updateRecipientStatus(
              recipient.id,
              'failed',
              null,
              error?.code || 500,
              error?.message || 'Failed to send message'
            );
            failedCount++;
          }
        }

        // Update broadcast progress
        await this.updateBroadcastProgress(broadcastId, sentCount, failedCount);

        // Rate limiting: wait before next batch (except for last batch)
        if (i + batchSize < recipients.length) {
          await this.sleep(delayBetweenBatches);
        }
      }

      // Mark broadcast as sent
      await supabaseAdmin
        .from('whatsapp_broadcasts')
        .update({
          status: 'sent',
          completed_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      return {
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: recipients.length
      };
    } catch (error) {
      console.error('Error sending broadcast:', error);

      // Update broadcast status to failed
      await supabaseAdmin
        .from('whatsapp_broadcasts')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', broadcastId)
        .catch(err => console.error('Error updating broadcast status:', err));

      throw error instanceof ApiError ? error : new ApiError('Failed to send broadcast', 500);
    }
  }

  /**
   * Send message to a single recipient
   */
  async sendToRecipient(broadcast, recipient) {
    try {
      const context = {
        lead_id: recipient.lead_id,
        contact_id: recipient.contact_id,
        user_id: broadcast.created_by
      };

      let result;

      switch (broadcast.message_type) {
        case 'text':
          result = await whatsappSendService.sendTextMessage(
            broadcast.company_id,
            recipient.whatsapp_id,
            broadcast.content,
            context
          );
          break;

        case 'template':
          result = await whatsappSendService.sendTemplateMessage(
            broadcast.company_id,
            recipient.whatsapp_id,
            broadcast.template_name,
            broadcast.template_language || 'en',
            broadcast.template_params || [],
            context
          );
          break;

        case 'media':
          result = await whatsappSendService.sendMediaMessage(
            broadcast.company_id,
            recipient.whatsapp_id,
            broadcast.media_type,
            broadcast.media_url,
            broadcast.media_caption,
            context
          );
          break;

        default:
          throw new ApiError(`Unsupported message type: ${broadcast.message_type}`, 400);
      }

      return {
        success: true,
        messageId: result.messageId || result.message?.id
      };
    } catch (error) {
      console.error(`Error sending to recipient ${recipient.whatsapp_id}:`, error);
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError(error.message, 500)
      };
    }
  }

  /**
   * Update recipient status
   */
  async updateRecipientStatus(recipientId, status, messageId, errorCode, errorMessage) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (messageId) {
        updateData.message_id = messageId;
        updateData.sent_at = new Date().toISOString();
      }

      if (errorCode) {
        updateData.error_code = errorCode;
        updateData.error_message = errorMessage;
      }

      await supabaseAdmin
        .from('whatsapp_broadcast_recipients')
        .update(updateData)
        .eq('id', recipientId);
    } catch (error) {
      console.error('Error updating recipient status:', error);
    }
  }

  /**
   * Update broadcast progress
   */
  async updateBroadcastProgress(broadcastId, sentCount, failedCount) {
    try {
      const { data: broadcast } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('progress')
        .eq('id', broadcastId)
        .single();

      const progress = broadcast?.progress || { sent: 0, delivered: 0, read: 0, failed: 0 };
      progress.sent = sentCount;
      progress.failed = failedCount;

      await supabaseAdmin
        .from('whatsapp_broadcasts')
        .update({ progress })
        .eq('id', broadcastId);
    } catch (error) {
      console.error('Error updating broadcast progress:', error);
    }
  }

  /**
   * Get broadcasts
   */
  async getBroadcasts(companyId, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        broadcasts: data || []
      };
    } catch (error) {
      console.error('Error getting broadcasts:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to get broadcasts', 500);
    }
  }

  /**
   * Get broadcast by ID
   */
  async getBroadcastById(broadcastId, companyId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_broadcasts')
        .select('*')
        .eq('id', broadcastId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;

      // Get recipients
      const { data: recipients } = await supabaseAdmin
        .from('whatsapp_broadcast_recipients')
        .select('*, lead:leads(id, name, phone), contact:contacts(id, first_name, last_name, phone)')
        .eq('broadcast_id', broadcastId)
        .order('created_at', { ascending: true });

      return {
        success: true,
        broadcast: {
          ...data,
          recipients: recipients || []
        }
      };
    } catch (error) {
      console.error('Error getting broadcast:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to get broadcast', 500);
    }
  }

  /**
   * Normalize phone number (remove +, spaces, etc.)
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    return phone.replace(/[+\s-()]/g, '');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WhatsAppBroadcastService();

