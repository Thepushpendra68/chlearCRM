/**
 * WhatsApp Service
 * Handles all WhatsApp-related API calls
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const whatsappApi = axios.create({
  baseURL: `${API_URL}/whatsapp`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
whatsappApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
whatsappApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Send a text message via WhatsApp
 */
export const sendTextMessage = async ({ to, message, leadId }) => {
  try {
    const response = await whatsappApi.post('/send/text', {
      to,
      message,
      lead_id: leadId
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
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
    const response = await whatsappApi.post('/send/template', {
      to,
      template_name: templateName,
      language,
      parameters,
      lead_id: leadId
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
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

    const response = await whatsappApi.get(`/messages?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get messages for a specific lead
 */
export const getLeadMessages = async (leadId) => {
  try {
    const response = await whatsappApi.get(`/messages/${leadId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
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

    const response = await whatsappApi.get(`/conversations?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get conversation by phone number
 */
export const getConversationByPhone = async (whatsappId) => {
  try {
    const response = await whatsappApi.get(`/conversations/${whatsappId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Sync templates from Meta
 */
export const syncTemplates = async () => {
  try {
    const response = await whatsappApi.post('/templates/sync');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
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

    const response = await whatsappApi.get(`/templates?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get WhatsApp settings
 */
export const getSettings = async () => {
  try {
    const response = await whatsappApi.get('/settings');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Update WhatsApp settings
 */
export const updateSettings = async (settings) => {
  try {
    const response = await whatsappApi.put('/settings', settings);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async () => {
  try {
    const response = await whatsappApi.get('/conversations/unread/count');
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
    const response = await whatsappApi.post(`/conversations/${whatsappId}/read`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
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

