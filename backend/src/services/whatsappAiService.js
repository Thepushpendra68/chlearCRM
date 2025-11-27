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

      // Translate response to detected language if not English
      let translatedResponse = chatbotResponse.response;
      if (detectedLanguage !== 'en' && chatbotResponse.response) {
        try {
          translatedResponse = await this.translateMessage(chatbotResponse.response, detectedLanguage);
          console.log(`[WhatsApp AI] Translated response to ${detectedLanguage}`);
        } catch (translateError) {
          console.warn('[WhatsApp AI] Translation failed, using original response:', translateError.message);
          // Continue with original English response
        }
      }

      // If auto-reply is enabled and it's a simple chat response, send it
      if (autoReply && chatbotResponse.action === 'CHAT') {
        await this.sendAutoReply(
          companyId,
          whatsappId,
          translatedResponse,
          context
        );
      }

      // If action was executed and needs confirmation, send confirmation message
      if (chatbotResponse.action !== 'CHAT' && chatbotResponse.needsConfirmation && chatbotResponse.data) {
        let confirmationMessage = this.buildConfirmationMessage(chatbotResponse);
        // Translate confirmation message
        if (detectedLanguage !== 'en') {
          try {
            confirmationMessage = await this.translateMessage(confirmationMessage, detectedLanguage);
          } catch (translateError) {
            console.warn('[WhatsApp AI] Failed to translate confirmation message:', translateError.message);
          }
        }
        await this.sendAutoReply(
          companyId,
          whatsappId,
          confirmationMessage,
          context
        );
      }

      // If action was executed successfully, send success message
      if (chatbotResponse.action !== 'CHAT' && !chatbotResponse.needsConfirmation && chatbotResponse.data) {
        let successMessage = this.buildSuccessMessage(chatbotResponse);
        // Translate success message
        if (detectedLanguage !== 'en') {
          try {
            successMessage = await this.translateMessage(successMessage, detectedLanguage);
          } catch (translateError) {
            console.warn('[WhatsApp AI] Failed to translate success message:', translateError.message);
          }
        }
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

  /**
   * Translate message to target language using Gemini AI
   * @param {string} message - Message to translate
   * @param {string} targetLanguage - Target language code (hi, ta, te, etc.)
   * @returns {string} Translated message
   */
  async translateMessage(message, targetLanguage) {
    try {
      // Language name mapping
      const languageNames = {
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'bn': 'Bengali',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi',
        'en': 'English'
      };

      const targetLangName = languageNames[targetLanguage] || 'English';
      
      // Use Gemini AI for translation if available
      if (process.env.GEMINI_API_KEY && process.env.CHATBOT_FALLBACK_ONLY !== 'true') {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        const prompt = `Translate the following message to ${targetLangName}. Only return the translated text, nothing else:\n\n${message}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();
        
        return translatedText || message; // Fallback to original if translation fails
      }

      // Fallback: return original message if translation not available
      return message;
    } catch (error) {
      console.error('[WhatsApp AI] Translation error:', error);
      return message; // Return original message on error
    }
  }

  /**
   * Build interactive button message for CRM actions
   * @param {string} bodyText - Main message text
   * @param {array} buttons - Array of button objects {id, title}
   * @param {string} footerText - Optional footer text
   * @returns {object} Interactive message structure
   */
  buildInteractiveButtons(bodyText, buttons, footerText = null) {
    if (!buttons || buttons.length === 0 || buttons.length > 3) {
      throw new Error('Buttons array must have 1-3 buttons');
    }

    return {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title
          }
        }))
      },
      ...(footerText ? { footer: { text: footerText } } : {})
    };
  }

  /**
   * Build interactive list message for CRM actions
   * @param {string} bodyText - Main message text
   * @param {string} buttonText - Button text (e.g., "View Options")
   * @param {array} sections - Array of section objects {title, rows: [{id, title, description}]}
   * @param {string} footerText - Optional footer text
   * @returns {object} Interactive message structure
   */
  buildInteractiveList(bodyText, buttonText, sections, footerText = null) {
    if (!sections || sections.length === 0 || sections.length > 10) {
      throw new Error('Sections array must have 1-10 sections');
    }

    return {
      type: 'list',
      body: {
        text: bodyText
      },
      action: {
        button: buttonText,
        sections: sections.map(section => ({
          title: section.title,
          rows: section.rows.map(row => ({
            id: row.id,
            title: row.title,
            ...(row.description ? { description: row.description } : {})
          }))
        }))
      },
      ...(footerText ? { footer: { text: footerText } } : {})
    };
  }

  /**
   * Send interactive message with CRM action buttons
   * @param {string} companyId - Company ID
   * @param {string} whatsappId - WhatsApp ID
   * @param {string} message - Main message text
   * @param {array} actions - Array of action objects {id, title, action}
   * @param {object} context - Context for logging
   * @returns {object} Send result
   */
  async sendInteractiveActionMessage(companyId, whatsappId, message, actions, context = {}) {
    try {
      const whatsappSendService = require('./whatsappSendService');
      
      // Build interactive buttons (max 3 buttons)
      const buttons = actions.slice(0, 3).map((action, index) => ({
        id: `action_${action.id || index}`,
        title: action.title
      }));

      const interactiveData = this.buildInteractiveButtons(
        message,
        buttons,
        'Select an action'
      );

      const result = await whatsappSendService.sendInteractiveMessage(
        companyId,
        whatsappId,
        interactiveData,
        context
      );

      return result;
    } catch (error) {
      console.error('[WhatsApp AI] Error sending interactive message:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppAiService();

