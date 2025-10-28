import api from './api';

const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get recent leads
   */
  getRecentLeads: async (limit = 10) => {
    try {
      const response = await api.get('/dashboard/recent-leads', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get lead trends over time
   */
  getLeadTrends: async (period = '30d') => {
    try {
      const response = await api.get('/dashboard/lead-trends', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get lead source distribution
   */
  getLeadSources: async () => {
    try {
      const response = await api.get('/dashboard/lead-sources');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get lead status distribution
   */
  getLeadStatus: async () => {
    try {
      const response = await api.get('/dashboard/lead-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get user performance metrics (admin only)
   */
  getUserPerformance: async () => {
    try {
      const response = await api.get('/dashboard/user-performance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get monthly trends
   */
  getMonthlyTrends: async () => {
    try {
      const response = await api.get('/dashboard/monthly-trends');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default dashboardService;
