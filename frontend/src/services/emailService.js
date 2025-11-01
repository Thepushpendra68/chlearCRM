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
}

export default new EmailService();

