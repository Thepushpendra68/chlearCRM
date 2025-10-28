import api from './api';

const reportService = {
  /**
   * Get lead performance metrics
   */
  getLeadPerformance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.pipelineStageId) params.append('pipelineStageId', filters.pipelineStageId);
      if (filters.source) params.append('source', filters.source);
      if (filters.industry) params.append('industry', filters.industry);

      const response = await api.get(`/reports/lead-performance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead performance:', error);
      throw error;
    }
  },

  /**
   * Get conversion funnel analysis
   */
  getConversionFunnel: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await api.get(`/reports/conversion-funnel?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      throw error;
    }
  },

  /**
   * Get activity summary reports
   */
  getActivitySummary: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.activityType) params.append('activityType', filters.activityType);
      if (filters.leadId) params.append('leadId', filters.leadId);

      const response = await api.get(`/reports/activity-summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw error;
    }
  },

  /**
   * Get team performance metrics
   */
  getTeamPerformance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.teamId) params.append('teamId', filters.teamId);

      const response = await api.get(`/reports/team-performance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team performance:', error);
      throw error;
    }
  },

  /**
   * Get pipeline health analysis
   */
  getPipelineHealth: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await api.get(`/reports/pipeline-health?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pipeline health:', error);
      throw error;
    }
  },

  /**
   * Generate custom report
   */
  generateCustomReport: async (reportConfig) => {
    try {
      const response = await api.post('/reports/custom', reportConfig);
      return response.data;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  },

  /**
   * Export report in various formats
   */
  exportReport: async (exportConfig) => {
    try {
      const { type, reportType, data, format, filename } = exportConfig;
      
      const response = await api.post(`/reports/export/${type}`, {
        reportType,
        data,
        format,
        filename
      }, {
        responseType: 'blob' // Important for file downloads
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use provided filename
      const contentDisposition = response.headers['content-disposition'];
      let downloadFilename = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', downloadFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, filename: downloadFilename };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  /**
   * Get scheduled reports
   */
  getScheduledReports: async (userId) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await api.get(`/reports/scheduled?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }
  },

  /**
   * Schedule recurring report
   */
  scheduleReport: async (scheduleConfig) => {
    try {
      const response = await api.post('/reports/schedule', scheduleConfig);
      return response.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  },

  /**
   * Get report templates
   */
  getReportTemplates: async () => {
    try {
      const response = await api.get('/reports/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  },

  /**
   * Get available metrics and dimensions for custom reports
   */
  getReportOptions: async () => {
    try {
      const response = await api.get('/reports/options');
      return response.data;
    } catch (error) {
      console.error('Error fetching report options:', error);
      throw error;
    }
  },

  /**
   * Get dashboard analytics (from existing analytics service)
   */
  getDashboardAnalytics: async () => {
    try {
      const response = await api.get('/dashboard/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  },

  /**
   * Get lead trends
   */
  getLeadTrends: async (period = '30d') => {
    try {
      const response = await api.get(`/dashboard/analytics/trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead trends:', error);
      throw error;
    }
  },

  /**
   * Get lead sources distribution
   */
  getLeadSources: async () => {
    try {
      const response = await api.get('/dashboard/analytics/sources');
      return response.data;
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      throw error;
    }
  },

  /**
   * Get user performance metrics
   */
  getUserPerformance: async () => {
    try {
      const response = await api.get('/dashboard/analytics/performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching user performance:', error);
      throw error;
    }
  }
};

export { reportService };
