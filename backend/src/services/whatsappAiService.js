const chatbotService = require('./chatbotService');
const whatsappSendService = require('./whatsappSendService');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp AI Service
 * Integrates AI chatbot with WhatsApp for automated responses and CRM actions
 */
class WhatsAppAiService {
  /**
   * Detect language from message text
   * Simple detection based on character patterns
   * @param {string} text - Message text
   * @returns {string} Language code (en, hi, ta, te, etc.)
   */
  detectLanguage(text) {
    if (!text || typeof text !== 'string') {
      return 'en'; // Default to English
    }

    const normalizedText = text.toLowerCase().trim();

    // Hindi detection (Devanagari script)
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Tamil detection
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'ta';
    }

    // Telugu detection
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return 'te';
    }

    // Bengali detection
    if (/[\u0980-\u09FF]/.test(text)) {
      return 'bn';
    }

    // Marathi detection (also uses Devanagari, but check for common words)
    if (/[\u0900-\u097F]/.test(text) && 
        (normalizedText.includes('मी') || normalizedText.includes('तुम्ही'))) {
      return 'mr';
    }

    // Gujarati detection
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return 'gu';
    }

    // Kannada detection
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return 'kn';
    }

    // Malayalam detection
    if (/[\u0D00-\u0D7F]/.test(text)) {
      return 'ml';
    }

    // Punjabi detection
    if (/[\u0A00-\u0A7F]/.test(text)) {
      return 'pa';
    }

    // Default to English
    return 'en';
  }

  /**
   * Get system user for WhatsApp AI actions
   * Creates a virtual user for WhatsApp AI operations
   */
  async getSystemUser(companyId) {
    try {
      // Try to find a system/admin user for this company
      const { data: adminUser } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('company_id', companyId)
        .in('role', ['super_admin', 'company_admin', 'manager'])
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (adminUser) {
        return adminUser;
      }

      // Fallback: return a minimal system user object
      return {
        id: null,
        company_id: companyId,
        role: 'system',
        email: 'whatsapp-ai@system',
        first_name: 'WhatsApp',
        last_name: 'AI'
      };
    } catch (error) {
      console.error('Error getting system user:', error);
      return {
        id: null,
        company_id: companyId,
        role: 'system',
        email: 'whatsapp-ai@system',
        first_name: 'WhatsApp',
        last_name: 'AI'
      };
    }
  }

  /**
   * Process incoming WhatsApp message with AI
   * @param {string} companyId - Company ID
   * @param {string} whatsappId - WhatsApp number
   * @param {string} messageText - Message content
   * @param {object} context - Context (lead_id, contact_id, etc.)
   * @param {object} options - Options (autoReply, language, etc.)
   * @returns {object} Processing result
   */
  async processIncomingMessage(companyId, whatsappId, messageText, context = {}, options = {}) {
    try {
      const {
        autoReply = true, // Auto-reply enabled by default
        language = null, // Auto-detect if not provided
        userId = null // Use system user if not provided
      } = options;

      // Detect language if not provided
      const detectedLanguage = language || this.detectLanguage(messageText);
      
      console.log(`[WhatsApp AI] Processing message from ${whatsappId}, language: ${detectedLanguage}`);

      // Get system user for AI operations
      const systemUser = userId 
        ? await this.getUserById(userId, companyId)
        : await this.getSystemUser(companyId);

      // Create unique user ID for WhatsApp conversation
      // Use WhatsApp ID as the conversation identifier
      const conversationUserId = `whatsapp_${companyId}_${whatsappId}`;

      // Process message with chatbot
      const chatbotResponse = await chatbotService.processMessage(
        conversationUserId,
        messageText,
        systemUser
      );

      console.log(`[WhatsApp AI] Chatbot response:`, {
        action: chatbotResponse.action,
        intent: chatbotResponse.intent,
        needsConfirmation: chatbotResponse.needsConfirmation
      });

      // If auto-reply is enabled and it's a simple chat response, send it
      if (autoReply && chatbotResponse.action === 'CHAT') {
        await this.sendAutoReply(
          companyId,
          whatsappId,
          chatbotResponse.response,
          context
        );
      }

      // If action was executed and needs confirmation, send confirmation message
      if (chatbotResponse.action !== 'CHAT' && chatbotResponse.needsConfirmation && chatbotResponse.data) {
        const confirmationMessage = this.buildConfirmationMessage(chatbotResponse);
        await this.sendAutoReply(
          companyId,
          whatsappId,
          confirmationMessage,
          context
        );
      }

      // If action was executed successfully, send success message
      if (chatbotResponse.action !== 'CHAT' && !chatbotResponse.needsConfirmation && chatbotResponse.data) {
        const successMessage = this.buildSuccessMessage(chatbotResponse);
        await this.sendAutoReply(
          companyId,
          whatsappId,
          successMessage,
          context
        );
      }

      return {
        success: true,
        chatbotResponse,
        language: detectedLanguage,
        autoReplied: autoReply && chatbotResponse.action === 'CHAT'
      };
    } catch (error) {
      console.error('[WhatsApp AI] Error processing message:', error);
      
      // Send error message to user
      try {
        await this.sendAutoReply(
          companyId,
          whatsappId,
          'Sorry, I encountered an error processing your message. Please try again or contact support.',
          context
        );
      } catch (sendError) {
        console.error('[WhatsApp AI] Error sending error message:', sendError);
      }

      throw error instanceof ApiError ? error : new ApiError('Failed to process WhatsApp message with AI', 500);
    }
  }

  /**
   * Send auto-reply message
   */
  async sendAutoReply(companyId, whatsappId, message, context = {}) {
    try {
      await whatsappSendService.sendTextMessage(
        companyId,
        whatsappId,
        message,
        {
          ...context,
          user_id: null // System-generated message
        }
      );
    } catch (error) {
      console.error('[WhatsApp AI] Error sending auto-reply:', error);
      throw error;
    }
  }

  /**
   * Build confirmation message for actions requiring confirmation
   */
  buildConfirmationMessage(chatbotResponse) {
    const { action, intent, response, data } = chatbotResponse;
    
    let message = response || 'I need your confirmation to proceed.';
    
    if (data && action === 'CREATE_LEAD') {
      const lead = data.lead || data;
      message = `I'll create a lead for ${lead.first_name || ''} ${lead.last_name || ''} (${lead.email || 'no email'}). Please confirm by replying "yes" or "confirm".`;
    } else if (data && action === 'UPDATE_LEAD') {
      message = `I'll update the lead. Please confirm by replying "yes" or "confirm".`;
    } else if (data && action === 'DELETE_LEAD') {
      message = `⚠️ This action cannot be undone. Please confirm by replying "yes" or "confirm".`;
    }

    return message;
  }

  /**
   * Build success message for completed actions
   */
  buildSuccessMessage(chatbotResponse) {
    const { action, intent, response, data } = chatbotResponse;
    
    let message = response || 'Action completed successfully.';

    if (data && action === 'CREATE_LEAD' && data.lead) {
      const lead = data.lead;
      message = `✅ Lead created successfully!\n\nName: ${lead.first_name} ${lead.last_name}\nEmail: ${lead.email || 'N/A'}\nStatus: ${lead.status || 'new'}`;
    } else if (data && action === 'UPDATE_LEAD' && data.lead) {
      const lead = data.lead;
      message = `✅ Lead updated successfully!\n\n${lead.first_name} ${lead.last_name} (${lead.email || 'N/A'})`;
    } else if (data && action === 'LIST_LEADS' && data.leads) {
      const count = data.leads.length;
      message = `Found ${count} lead${count !== 1 ? 's' : ''}:\n\n${data.leads.slice(0, 5).map((lead, idx) => 
        `${idx + 1}. ${lead.first_name} ${lead.last_name} - ${lead.email || lead.phone || 'N/A'}`
      ).join('\n')}${count > 5 ? `\n\n... and ${count - 5} more` : ''}`;
    } else if (data && action === 'SEARCH_LEADS' && data.leads) {
      const count = data.leads.length;
      if (count === 0) {
        message = 'No leads found matching your search.';
      } else {
        message = `Found ${count} lead${count !== 1 ? 's' : ''}:\n\n${data.leads.slice(0, 5).map((lead, idx) => 
          `${idx + 1}. ${lead.first_name} ${lead.last_name} - ${lead.email || lead.phone || 'N/A'}`
        ).join('\n')}${count > 5 ? `\n\n... and ${count - 5} more` : ''}`;
      }
    } else if (data && action === 'GET_STATS') {
      const stats = data.stats || {};
      message = `📊 Lead Statistics:\n\nTotal: ${stats.total || 0}\nNew: ${stats.new || 0}\nQualified: ${stats.qualified || 0}\nWon: ${stats.won || 0}`;
    }

    return message;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId, companyId) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return await this.getSystemUser(companyId);
      }

      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return await this.getSystemUser(companyId);
    }
  }

  /**
   * Check if auto-reply is enabled for company
   */
  async isAutoReplyEnabled(companyId) {
    try {
      const { data: settings } = await supabaseAdmin
        .from('integration_settings')
        .select('config')
        .eq('company_id', companyId)
        .eq('type', 'whatsapp')
        .eq('provider', 'meta')
        .eq('is_active', true)
        .maybeSingle();

      if (!settings || !settings.config) {
        return true; // Default to enabled
      }

      return settings.config.auto_reply !== false; // Default to true
    } catch (error) {
      console.error('Error checking auto-reply settings:', error);
      return true; // Default to enabled
    }
  }
}

module.exports = new WhatsAppAiService();

