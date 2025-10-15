import api from './api';

const picklistService = {
  getLeadPicklists: async (params = {}) => {
    try {
      const response = await api.get('/picklists/leads', {
        params
      });
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createLeadOption: async (payload) => {
    try {
      const response = await api.post('/picklists/leads', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateLeadOption: async (id, payload) => {
    try {
      const response = await api.put(`/picklists/leads/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteLeadOption: async (id, params = {}) => {
    try {
      const response = await api.delete(`/picklists/leads/${id}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  reorderLeadOptions: async (payload) => {
    try {
      const response = await api.put('/picklists/leads/reorder', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default picklistService;
