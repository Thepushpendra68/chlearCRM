import api from './api';

const leadService = {
  /**
   * Get all leads with pagination and filtering
   */
  getLeads: async (params = {}) => {
    try {
      const response = await api.get('/leads', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get lead by ID
   */
  getLeadById: async (id) => {
    try {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create new lead
   */
  createLead: async (leadData) => {
    try {
      const response = await api.post('/leads', leadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update lead
   */
  updateLead: async (id, leadData) => {
    try {
      const response = await api.put(`/leads/${id}`, leadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete lead
   */
  deleteLead: async (id) => {
    try {
      const response = await api.delete(`/leads/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get lead statistics
   */
  getLeadStats: async () => {
    try {
      const response = await api.get('/leads/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Search leads
   */
  searchLeads: async (searchTerm, filters = {}) => {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      const response = await api.get('/leads', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get leads by status
   */
  getLeadsByStatus: async (status) => {
    try {
      const response = await api.get('/leads', {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get leads by source
   */
  getLeadsBySource: async (source) => {
    try {
      const response = await api.get('/leads', {
        params: { source }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get leads assigned to user
   */
  getLeadsByUser: async (userId) => {
    try {
      const response = await api.get('/leads', {
        params: { assigned_to: userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get industry configuration for current company
   */
  getIndustryConfig: async () => {
    try {
      const response = await api.get('/config/industry');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get form layout configuration
   */
  getFormLayout: async () => {
    try {
      const response = await api.get('/config/form-layout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get field definitions
   */
  getFieldDefinitions: async () => {
    try {
      const response = await api.get('/config/fields');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get industry-specific terminology
   */
  getTerminology: async () => {
    try {
      const response = await api.get('/config/terminology');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default leadService;
