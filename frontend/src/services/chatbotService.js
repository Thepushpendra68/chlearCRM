import api from './api';

const chatbotService = {
  /**
   * Send message to chatbot
   */
  sendMessage: async (message) => {
    try {
      const response = await api.post('/chatbot/message', { message });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  },

  /**
   * Confirm and execute pending action
   */
  confirmAction: async (action, parameters) => {
    try {
      const response = await api.post('/chatbot/confirm', { action, parameters });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  },

  /**
   * Clear conversation history
   */
  clearHistory: async () => {
    try {
      const response = await api.delete('/chatbot/history');
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  }
};

export default chatbotService;