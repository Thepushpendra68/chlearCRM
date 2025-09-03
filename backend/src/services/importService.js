const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const csvParser = require('../utils/csvParser');
const excelParser = require('../utils/excelParser');

class ImportService {
  /**
   * Import leads from CSV/Excel file
   */
  async importLeads(fileBuffer, fileName, userId, options = {}) {
    try {
      let leads = [];
      
      // Determine file type and parse accordingly
      if (fileName.endsWith('.csv')) {
        leads = await csvParser.parseCSV(fileBuffer, options.fieldMapping);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        leads = await excelParser.parseExcel(fileBuffer, options.fieldMapping);
      } else {
        throw new ApiError('Unsupported file format. Please use CSV or Excel files.', 400);
      }

      // Validate leads data
      const validationResult = await this.validateLeads(leads);
      
      // Import leads to database
      const importResult = await this.bulkInsertLeads(validationResult.validatedLeads, userId);
      
      // Log import history
      await this.logImportHistory({
        user_id: userId,
        file_name: fileName,
        total_records: leads.length,
        successful_imports: importResult.successful,
        failed_imports: importResult.failed,
        errors: importResult.errors.concat(validationResult.errors || [])
      });

      return {
        ...importResult,
        validationErrors: validationResult.errors || []
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to import leads', 500);
    }
  }

  /**
   * Validate leads data
   */
  async validateLeads(leads) {
    const validatedLeads = [];
    const errors = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const rowErrors = [];

      // Required field validation - first_name and last_name are required
      if (!lead.first_name || lead.first_name.trim() === '') {
        rowErrors.push('First name is required');
      }

      if (!lead.last_name || lead.last_name.trim() === '') {
        rowErrors.push('Last name is required');
      }

      // Email format validation (if provided)
      if (lead.email && !this.isValidEmail(lead.email)) {
        rowErrors.push('Invalid email format');
      }

      // Phone validation (if provided)
      if (lead.phone && !this.isValidPhone(lead.phone)) {
        rowErrors.push('Invalid phone format');
      }

      // Check for duplicate email (if provided)
      if (lead.email) {
        const existingLead = await db('leads')
          .where('email', lead.email.trim().toLowerCase())
          .first();
        
        if (existingLead) {
          rowErrors.push('Email already exists');
        }
      }

      // Validate status if provided
      if (lead.status && !['new', 'contacted', 'qualified', 'converted', 'lost'].includes(lead.status.toLowerCase())) {
        rowErrors.push('Invalid status. Must be one of: new, contacted, qualified, converted, lost');
      }

      // Validate lead_source if provided
      if (lead.lead_source && !['website', 'referral', 'cold_call', 'social_media', 'advertisement', 'other'].includes(lead.lead_source.toLowerCase())) {
        rowErrors.push('Invalid lead source. Must be one of: website, referral, cold_call, social_media, advertisement, other');
      }

      // Validate priority if provided
      if (lead.priority && !['low', 'medium', 'high', 'urgent'].includes(lead.priority.toLowerCase())) {
        rowErrors.push('Invalid priority. Must be one of: low, medium, high, urgent');
      }

      // Validate deal_value if provided
      if (lead.deal_value && (isNaN(parseFloat(lead.deal_value)) || parseFloat(lead.deal_value) < 0)) {
        rowErrors.push('Deal value must be a positive number');
      }

      // Validate probability if provided
      if (lead.probability && (isNaN(parseInt(lead.probability)) || parseInt(lead.probability) < 0 || parseInt(lead.probability) > 100)) {
        rowErrors.push('Probability must be between 0 and 100');
      }

      if (rowErrors.length === 0) {
        validatedLeads.push({
          first_name: lead.first_name.trim(),
          last_name: lead.last_name.trim(),
          email: lead.email ? lead.email.trim().toLowerCase() : null,
          phone: lead.phone ? lead.phone.trim() : null,
          company: lead.company ? lead.company.trim() : null,
          job_title: lead.job_title ? lead.job_title.trim() : null,
          lead_source: lead.lead_source ? lead.lead_source.trim().toLowerCase() : 'import',
          status: lead.status ? lead.status.trim().toLowerCase() : 'new',
          notes: lead.notes ? lead.notes.trim() : null,
          deal_value: lead.deal_value ? parseFloat(lead.deal_value) : null,
          probability: lead.probability ? parseInt(lead.probability) : 0,
          expected_close_date: lead.expected_close_date ? new Date(lead.expected_close_date) : null,
          priority: lead.priority ? lead.priority.trim().toLowerCase() : 'medium',
          created_at: new Date(),
          updated_at: new Date()
        });
      } else {
        errors.push({
          row: i + 1,
          data: lead,
          errors: rowErrors
        });
      }
    }

    return { validatedLeads, errors };
  }

  /**
   * Bulk insert leads
   */
  async bulkInsertLeads(leads, userId) {
    const result = {
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Insert leads in batches
      const batchSize = 100;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        // Add created_by to each lead in the batch
        const batchWithUser = batch.map(lead => ({
          ...lead,
          created_by: userId
        }));
        
        try {
          await db('leads').insert(batchWithUser);
          result.successful += batch.length;
        } catch (error) {
          result.failed += batch.length;
          result.errors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: error.message
          });
        }
      }

      return result;
    } catch (error) {
      throw new ApiError('Failed to insert leads', 500);
    }
  }

  /**
   * Export leads to various formats
   */
  async exportLeads(filters = {}, format = 'csv') {
    try {
      console.log('Starting export with filters:', filters, 'format:', format);
      
      let query = db('leads')
        .select(
          'leads.*',
          'users.first_name as assigned_first_name',
          'users.last_name as assigned_last_name',
          'pipeline_stages.name as stage_name'
        )
        .leftJoin('users', 'leads.assigned_to', 'users.id')
        .leftJoin('pipeline_stages', 'leads.pipeline_stage_id', 'pipeline_stages.id');

      // Apply filters
      if (filters.status && filters.status !== 'All Status') {
        query = query.where('leads.status', filters.status);
      }

      if (filters.lead_source && filters.lead_source !== 'All Sources') {
        query = query.where('leads.lead_source', filters.lead_source);
      }

      if (filters.assigned_to && filters.assigned_to !== 'All Users') {
        query = query.where('leads.assigned_to', filters.assigned_to);
      }

      if (filters.pipeline_stage_id && filters.pipeline_stage_id !== 'All Stages') {
        query = query.where('leads.pipeline_stage_id', filters.pipeline_stage_id);
      }

      if (filters.date_from) {
        query = query.where('leads.created_at', '>=', filters.date_from);
      }

      if (filters.date_to) {
        query = query.where('leads.created_at', '<=', filters.date_to);
      }

      const leads = await query.orderBy('leads.created_at', 'desc');
      console.log(`Found ${leads.length} leads for export`);

      // Format data for export
      const exportData = leads.map(lead => ({
        'First Name': lead.first_name || '',
        'Last Name': lead.last_name || '',
        'Email': lead.email || '',
        'Phone': lead.phone || '',
        'Company': lead.company || '',
        'Job Title': lead.job_title || '',
        'Lead Source': lead.lead_source || '',
        'Status': lead.status || '',
        'Stage': lead.stage_name || '',
        'Deal Value': lead.deal_value || '',
        'Probability': lead.probability || '',
        'Expected Close Date': lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : '',
        'Priority': lead.priority || '',
        'Assigned To': lead.assigned_first_name && lead.assigned_last_name 
          ? `${lead.assigned_first_name} ${lead.assigned_last_name}` 
          : '',
        'Created Date': lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
        'Last Updated': lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '',
        'Notes': lead.notes || ''
      }));

      console.log('Export data formatted successfully');
      return exportData;
    } catch (error) {
      console.error('Export service error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to export leads: ${error.message}`, 500);
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(userId = null) {
    try {
      let query = db('import_history')
        .select('*')
        .orderBy('created_at', 'desc');

      if (userId) {
        query = query.where('user_id', userId);
      }

      const history = await query;
      return history;
    } catch (error) {
      throw new ApiError('Failed to fetch import history', 500);
    }
  }

  /**
   * Log import history
   */
  async logImportHistory(importData) {
    try {
      await db('import_history').insert({
        user_id: importData.user_id,
        file_name: importData.file_name,
        total_records: importData.total_records,
        successful_imports: importData.successful_imports,
        failed_imports: importData.failed_imports,
        errors: JSON.stringify(importData.errors),
        created_at: new Date()
      });
    } catch (error) {
      console.error('Failed to log import history:', error);
    }
  }

  /**
   * Generate import template
   */
  generateImportTemplate() {
    return [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '+1234567890',
        'Company': 'Example Corp',
        'Job Title': 'CEO',
        'Lead Source': 'website',
        'Status': 'new',
        'Deal Value': '50000',
        'Probability': '75',
        'Expected Close Date': '2024-12-31',
        'Priority': 'high',
        'Notes': 'Interested in our premium package'
      }
    ];
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
}

module.exports = new ImportService();
