/**
 * WhatsApp Service
 * Handles all WhatsApp-related API calls
 */

import api from './api';
import { ensureSessionInitialized, getCachedSession } from '../config/supabase';

const normalizeError = (error) => {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  if (error.details && typeof error.details === 'string') {
    return error.details;
  }

  if (error.code && error.message) {
    return `${error.code}: ${error.message}`;
  }

  try {
    return JSON.stringify(error);
  } catch (jsonError) {
    return 'An unexpected error occurred.';
  }
};

/**
 * Extract error message from API error response
 * Backend returns: { success: false, error: { message, code } }
 */
const extractErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  
  const errorData = error.response?.data;
  if (errorData) {
    // Backend format: { success: false, error: { message, code } }
    if (errorData.error?.message) return errorData.error.message;
    if (errorData.message) return errorData.message;
    if (errorData.error) return typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
  }
  
  return error.message || 'An unexpected error occurred.';
};

/**
 * Send a text message via WhatsApp
 */
export const sendTextMessage = async ({ to, message, leadId }) => {
  try {
    // Ensure session is initialized (but don't fail if it's not - let API interceptor handle it)
    await ensureSessionInitialized();
    
    // Make the API call - the interceptor will handle token refresh if needed
    const response = await api.post('/whatsapp/send/text', {
      to,
      message,
      lead_id: leadId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WhatsApp Service] Error sending text message:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      isRetry: error.config?._retry
    });

    const errorMessage = extractErrorMessage(error);

    // Special case: Meta (WhatsApp) access token has expired or is invalid
    if (
      error.response?.status === 401 &&
      typeof errorMessage === 'string' &&
      errorMessage.toLowerCase().includes('error validating access token')
    ) {
      return {
        success: false,
        error:
          'Your WhatsApp access token has expired. Please open WhatsApp Settings and update the Meta access token.',
      };
    }

    // Handle 401 - but only if refresh already failed (indicated by _retry flag)
    if (error.response?.status === 401 && error.config?._retry) {
      // This means token refresh was attempted and failed
      return {
        success: false,
        error: 'Your session has expired. Please refresh the page and login again.',
      };
    }
    
    // For other 401s (true auth issues), the API interceptor will handle refresh and retry
    // We just need to return a generic error
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }
    
    const normalized = normalizeError(errorMessage);
    
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Send a template message via WhatsApp
 */
export const sendTemplateMessage = async ({
  to,
  templateName,
  language = 'en',
  parameters = [],
  leadId
}) => {
  try {
    const response = await api.post('/whatsapp/send/template', {
      to,
      template_name: templateName,
      language,
      parameters,
      lead_id: leadId
    });
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get all messages with optional filters
 */
export const getMessages = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.leadId) params.append('lead_id', filters.leadId);
    if (filters.whatsappId) params.append('whatsapp_id', filters.whatsappId);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/whatsapp/messages?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get messages for a specific lead
 */
export const getLeadMessages = async (leadId) => {
  try {
    const response = await api.get(`/whatsapp/messages/${leadId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get all conversations
 */
export const getConversations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.isActive !== undefined) params.append('is_active', filters.isActive);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/whatsapp/conversations?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get conversation by phone number
 */
export const getConversationByPhone = async (whatsappId) => {
  try {
    const response = await api.get(`/whatsapp/conversations/${whatsappId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Sync templates from Meta
 */
export const syncTemplates = async () => {
  try {
    const response = await api.post('/whatsapp/templates/sync');
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get all templates
 */
export const getTemplates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.language) params.append('language', filters.language);

    const response = await api.get(`/whatsapp/templates?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get WhatsApp settings
 */
export const getSettings = async () => {
  try {
    const response = await api.get('/whatsapp/settings');
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Update WhatsApp settings
 */
export const updateSettings = async (settings) => {
  try {
    const response = await api.post('/whatsapp/settings', settings);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/whatsapp/conversations/unread/count');
    return { success: true, count: response.data.count || 0 };
  } catch (error) {
    return { success: false, count: 0 };
  }
};

/**
 * Mark conversation as read
 */
export const markAsRead = async (whatsappId) => {
  try {
    const response = await api.post(`/whatsapp/conversations/${whatsappId}/read`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    const normalized = normalizeError(errorMessage);
    return {
      success: false,
      error: normalized,
    };
  }
};

/**
 * Format phone number for WhatsApp (remove spaces, hyphens, etc.)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If doesn't start with country code, assume India (+91)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
};

/**
 * Format phone number for display
 */
export const formatPhoneDisplay = (phone) => {
  if (!phone) return '';
  
  // Remove country code for display
  let display = phone.replace(/^\+?91/, '');
  
  // Format as XXX XXX XXXX
  if (display.length === 10) {
    return `${display.slice(0, 3)} ${display.slice(3, 6)} ${display.slice(6)}`;
  }
  
  return phone;
};

/**
 * Check if phone number is valid WhatsApp format
 */
export const isValidWhatsAppNumber = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Should be 10 digits (without country code) or 12 digits (with country code)
  return cleaned.length === 10 || cleaned.length === 12;
};

export default {
  sendTextMessage,
  sendTemplateMessage,
  getMessages,
  getLeadMessages,
  getConversations,
  getConversationByPhone,
  syncTemplates,
  getTemplates,
  getSettings,
  updateSettings,
  getUnreadCount,
  markAsRead,
  formatPhoneNumber,
  formatPhoneDisplay,
  isValidWhatsAppNumber
};

