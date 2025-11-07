import api from './api';

const accountService = {
  /**
   * Get all accounts with pagination and filtering
   */
  getAccounts: async (params = {}) => {
    try {
      const response = await api.get('/accounts', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get account by ID
   */
  getAccountById: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create new account
   */
  createAccount: async (accountData) => {
    try {
      const response = await api.post('/accounts', accountData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update account
   */
  updateAccount: async (id, accountData) => {
    try {
      const response = await api.put(`/accounts/${id}`, accountData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete account
   */
  deleteAccount: async (id) => {
    try {
      const response = await api.delete(`/accounts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get account leads
   */
  getAccountLeads: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}/leads`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get account statistics
   */
  getAccountStats: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Search accounts
   */
  searchAccounts: async (searchTerm, filters = {}) => {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      const response = await api.get('/accounts', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get accounts by status
   */
  getAccountsByStatus: async (status) => {
    try {
      const response = await api.get('/accounts', {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get accounts by industry
   */
  getAccountsByIndustry: async (industry) => {
    try {
      const response = await api.get('/accounts', {
        params: { industry }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get accounts assigned to user
   */
  getAccountsByUser: async (userId) => {
    try {
      const response = await api.get('/accounts', {
        params: { assigned_to: userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get child accounts
   */
  getChildAccounts: async (parentAccountId) => {
    try {
      const response = await api.get('/accounts', {
        params: { parent_account_id: parentAccountId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get account timeline
   */
  getAccountTimeline: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}/timeline`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default accountService;

