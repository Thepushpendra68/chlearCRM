import api from './api';

/**
 * Email Service
 * Handles all email-related API calls
 */
class EmailService {
  // ================== TEMPLATES ==================
  
  /**
   * Get all templates
   */
  async getTemplates(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.folder) params.append('folder', filters.folder);
      if (filters.category) params.append('category', filters.category);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/email/templates?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    try {
      const response = await api.get(`/email/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  /**
   * Create template
   */
  async createTemplate(templateData) {
    try {
      const response = await api.post('/email/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, templateData) {
    try {
      const response = await api.put(`/email/templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    try {
      const response = await api.delete(`/email/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Get folders
   */
  async getFolders() {
    try {
      const response = await api.get('/email/templates/folders');
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }

  // ================== TEMPLATE VERSIONS ==================

  /**
   * Create template version
   */
  async createVersion(templateId, versionData) {
    try {
      const response = await api.post(`/email/templates/${templateId}/versions`, versionData);
      return response.data;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Publish version
   */
  async publishVersion(versionId) {
    try {
      const response = await api.post(`/email/templates/versions/${versionId}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing version:', error);
      throw error;
    }
  }

  /**
   * Preview template
   */
  async previewTemplate(versionId, data = {}) {
    try {
      const response = await api.post(`/email/templates/versions/${versionId}/preview`, { data });
      return response.data;
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  /**
   * Compile MJML
   */
  async compileMJML(mjml) {
    try {
      const response = await api.post('/email/templates/compile-mjml', { mjml });
      // Backend returns { success: true, data: { html, errors } }
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error compiling MJML:', error);
      throw error;
    }
  }

  // ================== SENDING ==================

  /**
   * Send email to lead
   */
  async sendToLead(leadId, templateVersionId, customData = {}) {
    try {
      const response = await api.post('/email/send/lead', {
        lead_id: leadId,
        template_version_id: templateVersionId,
        custom_data: customData
      });
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send email to custom recipient
   */
  async sendToEmail(email, name, templateVersionId, customData = {}) {
    try {
      const response = await api.post('/email/send/custom', {
        email,
        name,
        template_version_id: templateVersionId,
        custom_data: customData
      });
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get sent emails
   */
  async getSentEmails(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.lead_id) params.append('lead_id', filters.lead_id);
      if (filters.template_id) params.append('template_id', filters.template_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/email/sent?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sent emails:', error);
      throw error;
    }
  }

  /**
   * Get email details
   */
  async getEmailDetails(messageId) {
    try {
      const response = await api.get(`/email/sent/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching email details:', error);
      throw error;
    }
  }

  // ================== SEQUENCES ==================

  /**
   * Get all sequences
   */
  async getSequences(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);

      const response = await api.get(`/email/sequences?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sequences:', error);
      throw error;
    }
  }

  /**
   * Get sequence by ID
   */
  async getSequence(sequenceId) {
    try {
      const response = await api.get(`/email/sequences/${sequenceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sequence:', error);
      throw error;
    }
  }

  /**
   * Create sequence
   */
  async createSequence(sequenceData) {
    try {
      const response = await api.post('/email/sequences', sequenceData);
      return response.data;
    } catch (error) {
      console.error('Error creating sequence:', error);
      throw error;
    }
  }

  /**
   * Update sequence
   */
  async updateSequence(sequenceId, sequenceData) {
    try {
      const response = await api.put(`/email/sequences/${sequenceId}`, sequenceData);
      return response.data;
    } catch (error) {
      console.error('Error updating sequence:', error);
      throw error;
    }
  }

  /**
   * Delete sequence
   */
  async deleteSequence(sequenceId) {
    try {
      const response = await api.delete(`/email/sequences/${sequenceId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting sequence:', error);
      throw error;
    }
  }

  /**
   * Enroll lead in sequence
   */
  async enrollLead(sequenceId, leadId) {
    try {
      const response = await api.post(`/email/sequences/${sequenceId}/enroll`, {
        lead_id: leadId
      });
      return response.data;
    } catch (error) {
      console.error('Error enrolling lead:', error);
      throw error;
    }
  }

  /**
   * Unenroll lead
   */
  async unenrollLead(enrollmentId, reason = 'manual') {
    try {
      const response = await api.post(`/email/enrollments/${enrollmentId}/unenroll`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error unenrolling lead:', error);
      throw error;
    }
  }

  /**
   * Get enrollments for sequence
   */
  async getEnrollments(sequenceId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/email/sequences/${sequenceId}/enrollments?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  }

  // ================== SUPPRESSION LIST ==================

  /**
   * Get suppression list
   */
  async getSuppressionList(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.reason) params.append('reason', filters.reason);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/email/suppression?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching suppression list:', error);
      throw error;
    }
  }

  /**
   * Add to suppression list
   */
  async addToSuppressionList(email, reason, notes = null) {
    try {
      const response = await api.post('/email/suppression', {
        email,
        reason,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to suppression list:', error);
      throw error;
    }
  }

  /**
   * Remove from suppression list
   */
  async removeFromSuppressionList(email) {
    try {
      const response = await api.delete(`/email/suppression/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from suppression list:', error);
      throw error;
    }
  }

  // ================== AI FEATURES ==================

  /**
   * Check AI availability status
   */
  async getAiStatus() {
    try {
      const response = await api.get('/email/ai/status');
      return response.data;
    } catch (error) {
      console.error('Error checking AI status:', error);
      throw error;
    }
  }

  /**
   * Generate template from description
   */
  async aiGenerateTemplate(description, templateType = 'general', context = {}) {
    try {
      const response = await api.post('/email/ai/generate-template', {
        description,
        template_type: templateType,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Error generating template:', error);
      throw error;
    }
  }

  /**
   * Generate subject line variants
   */
  async aiGenerateSubjectVariants(subject, leadId = null, count = 5) {
    try {
      const response = await api.post('/email/ai/generate-subject-variants', {
        subject,
        lead_id: leadId,
        count
      });
      return response.data;
    } catch (error) {
      console.error('Error generating subject variants:', error);
      throw error;
    }
  }

  /**
   * Optimize template content
   */
  async aiOptimizeContent(html, subject, goals = ['engagement', 'clarity']) {
    try {
      const response = await api.post('/email/ai/optimize-content', {
        html,
        subject,
        goals
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing content:', error);
      throw error;
    }
  }

  /**
   * Suggest personalization variables
   */
  async aiSuggestVariables(html, purpose = '') {
    try {
      const response = await api.post('/email/ai/suggest-variables', {
        html,
        purpose
      });
      return response.data;
    } catch (error) {
      console.error('Error suggesting variables:', error);
      throw error;
    }
  }

  /**
   * Generate email sequence from goal
   */
  async aiGenerateSequence(goal, leadType = 'prospect', sequenceLength = 5) {
    try {
      const response = await api.post('/email/ai/generate-sequence', {
        goal,
        lead_type: leadType,
        sequence_length: sequenceLength
      });
      return response.data;
    } catch (error) {
      console.error('Error generating sequence:', error);
      throw error;
    }
  }

  /**
   * Optimize sequence timing
   */
  async aiOptimizeTiming(sequenceSteps, targetAudience = {}) {
    try {
      const response = await api.post('/email/ai/optimize-timing', {
        sequence_steps: sequenceSteps,
        target_audience: targetAudience
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing timing:', error);
      throw error;
    }
  }

  /**
   * Generate personalized subject for specific lead
   */
  async aiPersonalizedSubject(leadId, emailContext = {}) {
    try {
      const response = await api.post('/email/ai/personalized-subject', {
        lead_id: leadId,
        email_context: emailContext
      });
      return response.data;
    } catch (error) {
      console.error('Error generating personalized subject:', error);
      throw error;
    }
  }

  /**
   * Generate personalized email for specific lead
   */
  async aiPersonalizedEmail(leadId, templateContext = {}) {
    try {
      const response = await api.post('/email/ai/personalized-email', {
        lead_id: leadId,
        template_context: templateContext
      });
      return response.data;
    } catch (error) {
      console.error('Error generating personalized email:', error);
      throw error;
    }
  }

  /**
   * Get optimal send time for lead
   */
  async aiOptimalSendTime(leadId, timezone = 'America/New_York') {
    try {
      const response = await api.post('/email/ai/optimal-send-time', {
        lead_id: leadId,
        timezone
      });
      return response.data;
    } catch (error) {
      console.error('Error getting optimal send time:', error);
      throw error;
    }
  }

  /**
   * Analyze email performance
   */
  async aiAnalyzePerformance(metrics, templateInfo = {}) {
    try {
      const response = await api.post('/email/ai/analyze-performance', {
        metrics,
        template_info: templateInfo
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }

  /**
   * Predict engagement likelihood
   */
  async aiPredictEngagement(leadId, emailData, historicalData = {}) {
    try {
      const response = await api.post('/email/ai/predict-engagement', {
        lead_id: leadId,
        email_data: emailData,
        historical_data: historicalData
      });
      return response.data;
    } catch (error) {
      console.error('Error predicting engagement:', error);
      throw error;
    }
  }

  // ================== WORKFLOW TEMPLATES ==================

  /**
   * Get all workflow templates
   */
  async getWorkflowTemplates(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.search) params.append('search', filters.search);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      if (filters.include_public !== undefined) params.append('include_public', filters.include_public);

      const response = await api.get(`/email/workflow-templates?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      throw error;
    }
  }

  /**
   * Get workflow template by ID
   */
  async getWorkflowTemplate(templateId) {
    try {
      const response = await api.get(`/email/workflow-templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      throw error;
    }
  }

  /**
   * Create workflow template
   */
  async createWorkflowTemplate(templateData) {
    try {
      const response = await api.post('/email/workflow-templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow template:', error);
      throw error;
    }
  }

  /**
   * Update workflow template
   */
  async updateWorkflowTemplate(templateId, templateData) {
    try {
      const response = await api.put(`/email/workflow-templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating workflow template:', error);
      throw error;
    }
  }

  /**
   * Delete workflow template
   */
  async deleteWorkflowTemplate(templateId) {
    try {
      const response = await api.delete(`/email/workflow-templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      throw error;
    }
  }

  /**
   * Create sequence from template
   */
  async createSequenceFromTemplate(templateId, sequenceData = {}) {
    try {
      const response = await api.post(`/email/workflow-templates/${templateId}/create-sequence`, sequenceData);
      return response.data;
    } catch (error) {
      console.error('Error creating sequence from template:', error);
      throw error;
    }
  }

  /**
   * Export workflow template as JSON
   */
  async exportWorkflowTemplate(templateId) {
    try {
      const response = await api.get(`/email/workflow-templates/${templateId}/export`);
      
      // Create download link
      const exportData = response.data.data || response.data;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportData.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error exporting workflow template:', error);
      throw error;
    }
  }

  /**
   * Import workflow template from JSON
   */
  async importWorkflowTemplate(importData) {
    try {
      const response = await api.post('/email/workflow-templates/import', importData);
      return response.data;
    } catch (error) {
      console.error('Error importing workflow template:', error);
      throw error;
    }
  }

  /**
   * Get workflow template packs
   */
  async getWorkflowTemplatePacks(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/email/workflow-templates/packs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow template packs:', error);
      throw error;
    }
  }

  /**
   * Get workflow template pack by ID
   */
  async getWorkflowTemplatePack(packId) {
    try {
      const response = await api.get(`/email/workflow-templates/packs/${packId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow template pack:', error);
      throw error;
    }
  }
}

export default new EmailService();

