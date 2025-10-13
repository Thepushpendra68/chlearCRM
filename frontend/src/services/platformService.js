import api from './api';

/**
 * Platform Service - Super Admin API calls
 */
const platformService = {
  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const response = await api.get('/platform/stats');
    return response.data;
  },

  /**
   * Get all companies
   */
  async getCompanies(params = {}) {
    const response = await api.get('/platform/companies', { params });
    return response.data;
  },

  /**
   * Get company details
   */
  async getCompanyDetails(companyId) {
    const response = await api.get(`/platform/companies/${companyId}`);
    return response.data;
  },

  /**
   * Update company status
   */
  async updateCompanyStatus(companyId, status, reason = null) {
    const response = await api.put(`/platform/companies/${companyId}/status`, {
      status,
      reason
    });
    return response.data;
  },

  /**
   * Search users across platform
   */
  async searchUsers(params = {}) {
    const response = await api.get('/platform/users/search', { params });
    return response.data;
  },

  /**
   * Create user within a specific company (super admin only)
   */
  async createUser(payload) {
    const response = await api.post('/platform/users', payload);
    return response.data;
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(params = {}) {
    const response = await api.get('/platform/audit-logs', { params });
    return response.data;
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 20) {
    const response = await api.get('/platform/activity', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Start impersonating a user
   */
  async startImpersonation(userId) {
    const response = await api.post('/platform/impersonate/start', {
      userId
    });
    return response.data;
  },

  /**
   * End impersonation session
   */
  async endImpersonation() {
    const response = await api.post('/platform/impersonate/end');
    return response.data;
  }
};

export default platformService;
