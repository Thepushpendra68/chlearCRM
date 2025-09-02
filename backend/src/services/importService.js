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
      const validatedLeads = await this.validateLeads(leads);
      
      // Import leads to database
      const importResult = await this.bulkInsertLeads(validatedLeads, userId);
      
      // Log import history
      await this.logImportHistory({
        user_id: userId,
        file_name: fileName,
        total_records: leads.length,
        successful_imports: importResult.successful,
        failed_imports: importResult.failed,
        errors: importResult.errors
      });

      return importResult;
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

      // Required field validation
      if (!lead.name || lead.name.trim() === '') {
        rowErrors.push('Name is required');
      }

      if (!lead.email || lead.email.trim() === '') {
        rowErrors.push('Email is required');
      }

      // Email format validation
      if (lead.email && !this.isValidEmail(lead.email)) {
        rowErrors.push('Invalid email format');
      }

      // Phone validation (if provided)
      if (lead.phone && !this.isValidPhone(lead.phone)) {
        rowErrors.push('Invalid phone format');
      }

      // Check for duplicate email
      if (lead.email) {
        const existingLead = await db('leads')
          .where('email', lead.email)
          .first();
        
        if (existingLead) {
          rowErrors.push('Email already exists');
        }
      }

      if (rowErrors.length === 0) {
        validatedLeads.push({
          name: lead.name.trim(),
          email: lead.email.trim().toLowerCase(),
          phone: lead.phone ? lead.phone.trim() : null,
          company: lead.company ? lead.company.trim() : null,
          position: lead.position ? lead.position.trim() : null,
          source: lead.source ? lead.source.trim() : 'import',
          status: lead.status ? lead.status.trim() : 'new',
          notes: lead.notes ? lead.notes.trim() : null,
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
        
        try {
          await db('leads').insert(batch);
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
      if (filters.status) {
        query = query.where('leads.status', filters.status);
      }

      if (filters.source) {
        query = query.where('leads.source', filters.source);
      }

      if (filters.assigned_to) {
        query = query.where('leads.assigned_to', filters.assigned_to);
      }

      if (filters.pipeline_stage_id) {
        query = query.where('leads.pipeline_stage_id', filters.pipeline_stage_id);
      }

      if (filters.date_from) {
        query = query.where('leads.created_at', '>=', filters.date_from);
      }

      if (filters.date_to) {
        query = query.where('leads.created_at', '<=', filters.date_to);
      }

      const leads = await query.orderBy('leads.created_at', 'desc');

      // Format data for export
      const exportData = leads.map(lead => ({
        'Name': lead.name,
        'Email': lead.email,
        'Phone': lead.phone || '',
        'Company': lead.company || '',
        'Position': lead.position || '',
        'Source': lead.source || '',
        'Status': lead.status || '',
        'Stage': lead.stage_name || '',
        'Assigned To': lead.assigned_first_name && lead.assigned_last_name 
          ? `${lead.assigned_first_name} ${lead.assigned_last_name}` 
          : '',
        'Created Date': lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
        'Last Updated': lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '',
        'Notes': lead.notes || ''
      }));

      return exportData;
    } catch (error) {
      throw new ApiError('Failed to export leads', 500);
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
        'Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Phone': '+1234567890',
        'Company': 'Example Corp',
        'Position': 'CEO',
        'Source': 'Website',
        'Status': 'New',
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
