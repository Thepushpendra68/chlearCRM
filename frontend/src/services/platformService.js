import api from './api';

const RANGE_LABELS = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year'
};

/**
 * Platform Service - Super Admin API calls
 */
export const normalizePlatformStats = (stats) => {
  if (!stats || typeof stats !== 'object') {
    return stats;
  }

  const toNumber = (value) => (typeof value === 'number' ? value : 0);
  const periodKey = stats.period_key || '30d';
  const resolvedLabel = stats.period_label || RANGE_LABELS[periodKey] || 'Last 30 days';
  const resolvedDays = stats.period_days || (periodKey === '1y' ? 365 : parseInt(periodKey, 10) || 30);
  const periodIs30d = periodKey === '30d';

  const newCompaniesPeriod = toNumber(
    stats.new_companies_period ?? (periodIs30d ? stats.new_companies_30d : undefined)
  );
  const newUsersPeriod = toNumber(
    stats.new_users_period ?? (periodIs30d ? stats.new_users_30d : undefined)
  );
  const leadsCreatedPeriod = toNumber(
    stats.leads_created_period ?? (periodIs30d ? stats.leads_created_30d : undefined)
  );
  const activeUsersPeriod = toNumber(
    stats.active_users_period ?? (periodIs30d ? stats.active_users_30d : undefined)
  );
  const activitiesPeriod = toNumber(
    stats.activities_period ?? stats.activities_7d
  );

  return {
    ...stats,
    totalCompanies: toNumber(stats.total_companies),
    activeCompanies: toNumber(stats.active_companies),
    trialCompanies: toNumber(stats.trial_companies),
    totalUsers: toNumber(stats.total_users),
    activeUsers: toNumber(stats.active_users),
    activeUsers30d: toNumber(stats.active_users_30d),
    activeUsersPeriod,
    totalLeads: toNumber(stats.total_leads),
    leadsCreated30d: toNumber(stats.leads_created_30d),
    leadsCreatedPeriod,
    totalActivities: toNumber(stats.total_activities),
    activities7d: toNumber(stats.activities_7d),
    activitiesPeriod,
    newCompanies30d: toNumber(stats.new_companies_30d),
    newUsers30d: toNumber(stats.new_users_30d),
    newCompaniesPeriod,
    newUsersPeriod,
    periodKey,
    periodLabel: resolvedLabel,
    periodDays: resolvedDays
  };
};

const platformService = {
  /**
   * Get platform statistics
   */
  async getPlatformStats(range) {
    const config = range ? { params: { range } } : undefined;
    const response = await api.get('/platform/stats', config);
    const payload = response.data;

    if (payload?.data) {
      payload.data = normalizePlatformStats(payload.data);
    }

    return payload;
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
