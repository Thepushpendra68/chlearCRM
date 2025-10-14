const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const csvParser = require('../utils/csvParser');
const excelParser = require('../utils/excelParser');

class ImportService {
  constructor() {
    this.leadsTableColumns = null;
  }

  /**
   * Resolve the company associated with a given user.
   */
  async getUserCompanyId(userId) {
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.company_id) {
      throw new ApiError('Failed to get user company information', 500);
    }

    return userProfile.company_id;
  }

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
      const companyId = await this.getUserCompanyId(userId);
      const validationResult = await this.validateLeads(leads, companyId);

      // Import leads to database
      const importResult = await this.bulkInsertLeads(validationResult.validatedLeads, userId, companyId);
      
      // Log import history
      await this.logImportHistory({
        user_id: userId,
        file_name: fileName,
        total_records: leads.length,
        successful_imports: importResult.successful,
        failed_imports: importResult.failed,
        errors: importResult.errors.concat(validationResult.errors || [])
      });

      // Return data with frontend-compatible field names
      return {
        total_records: leads.length,
        successful_imports: importResult.successful,
        failed_imports: importResult.failed,
        errors: importResult.errors,
        validation_errors: validationResult.errors || []
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to import leads', 500);
    }
  }

  /**
   * Validate leads data
   */
  async validateLeads(leads, companyId = null) {
    const validatedLeads = [];
    const errors = [];
    const seenEmails = new Set();

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
      let normalizedEmail = null;
      if (lead.email) {
        normalizedEmail = lead.email.trim().toLowerCase();

        if (seenEmails.has(normalizedEmail)) {
          rowErrors.push('Duplicate email found in import file');
        } else {
          seenEmails.add(normalizedEmail);
        }

        if (companyId && !rowErrors.includes('Duplicate email found in import file')) {
          const { data: existingLead, error } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('company_id', companyId)
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (error) {
            console.error('Failed to validate lead email uniqueness:', error);
            rowErrors.push('Could not validate email uniqueness. Please try again.');
          } else if (existingLead) {
            rowErrors.push('Email already exists');
          }
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
          email: normalizedEmail,
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
  async bulkInsertLeads(leads, userId, companyId) {
    const result = {
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      if (!companyId) {
        throw new ApiError('Failed to determine company for lead import', 500);
      }

      // Determine which columns actually exist in the leads table (cached)
      const availableColumns = await this.getLeadsTableColumns();

      // Whitelist of columns we allow to be populated during import
      const permittedColumns = [
        'company_id', 'first_name', 'last_name', 'name', 'email', 'phone',
        'company', 'title', 'job_title', 'source', 'lead_source', 'status',
        'deal_value', 'probability', 'expected_close_date', 'priority', 'notes',
        'assigned_to', 'pipeline_stage_id', 'created_by', 'created_at', 'updated_at'
      ];

      const allowedColumns = permittedColumns.filter(column => availableColumns.has(column));

      // Insert leads in batches using Supabase
      const batchSize = 100;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);

        // Add required fields and filter to only allowed columns
        const batchWithUser = batch.map(lead => {
          const normalizedLead = this.normalizeLeadForInsert(lead, availableColumns, userId, companyId);

          // Start with only allowed fields
          const cleanLead = {};

          // Copy only whitelisted fields
          allowedColumns.forEach(col => {
            if (col in normalizedLead && normalizedLead[col] !== undefined) {
              cleanLead[col] = normalizedLead[col];
            }
          });

          return cleanLead;
        });

        try {
          const { error } = await supabaseAdmin
            .from('leads')
            .insert(batchWithUser);

          if (error) {
            console.error(`Batch ${Math.floor(i / batchSize) + 1} insert error:`, error);
            result.failed += batch.length;
            result.errors.push({
              batch: Math.floor(i / batchSize) + 1,
              error: error.message,
              details: error.details || null,
              hint: error.hint || null
            });
          } else {
            result.successful += batch.length;
          }
        } catch (error) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} exception:`, error);
          result.failed += batch.length;
          result.errors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: error.message
          });
        }
      }

      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Bulk insert error:', error);
      throw new ApiError('Failed to insert leads', 500);
    }
  }

  /**
   * Fetch and cache the list of columns available on the leads table.
   * Helps the importer avoid referencing columns that are missing in Supabase.
   */
  async getLeadsTableColumns() {
    if (this.leadsTableColumns) {
      return this.leadsTableColumns;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'leads');

      if (error) {
        throw error;
      }

      this.leadsTableColumns = new Set(data.map(column => column.column_name));
    } catch (error) {
      console.error('Failed to load leads table columns, using fallback schema.', error);
      this.leadsTableColumns = new Set([
        'company_id', 'first_name', 'last_name', 'name', 'email', 'phone',
        'company', 'title', 'source', 'status', 'deal_value',
        'expected_close_date', 'priority', 'notes',
        'assigned_to', 'pipeline_stage_id', 'created_by', 'created_at', 'updated_at'
      ]);
    }

    return this.leadsTableColumns;
  }

  /**
   * Normalize a single lead payload so that it matches the columns available
   * in the Supabase leads table.
   */
  normalizeLeadForInsert(lead, availableColumns, userId, companyId) {
    const normalized = {};
    const nowIso = new Date().toISOString();

    const firstName = lead.first_name ? lead.first_name.trim() : null;
    const lastName = lead.last_name ? lead.last_name.trim() : null;

    if (availableColumns.has('first_name')) normalized.first_name = firstName;
    if (availableColumns.has('last_name')) normalized.last_name = lastName;

    if (availableColumns.has('name')) {
      const nameFromParts = `${firstName || ''} ${lastName || ''}`.trim();
      normalized.name = nameFromParts || lead.company?.trim() || lead.email?.trim() || 'Imported Lead';
    }

    if (availableColumns.has('email')) {
      normalized.email = lead.email ? lead.email.trim().toLowerCase() : null;
    }

    if (availableColumns.has('phone')) {
      normalized.phone = lead.phone ? lead.phone.trim() : null;
    }

    if (availableColumns.has('company')) {
      normalized.company = lead.company ? lead.company.trim() : null;
    }

    const jobTitle = lead.job_title ? lead.job_title.trim() : null;
    if (jobTitle) {
      if (availableColumns.has('job_title')) {
        normalized.job_title = jobTitle;
      } else if (availableColumns.has('title')) {
        normalized.title = jobTitle;
      }
    } else {
      if (availableColumns.has('job_title')) normalized.job_title = null;
      if (availableColumns.has('title')) normalized.title = null;
    }

    const leadSource = lead.lead_source ? lead.lead_source.trim().toLowerCase() : 'import';
    if (availableColumns.has('lead_source')) {
      normalized.lead_source = leadSource;
    } else if (availableColumns.has('source')) {
      normalized.source = leadSource;
    }

    if (availableColumns.has('status')) {
      normalized.status = lead.status ? lead.status.trim().toLowerCase() : 'new';
    }

    if (availableColumns.has('deal_value')) {
      normalized.deal_value =
        lead.deal_value !== undefined && lead.deal_value !== null && lead.deal_value !== ''
          ? parseFloat(lead.deal_value)
          : null;
    }

    if (availableColumns.has('probability')) {
      normalized.probability =
        lead.probability !== undefined && lead.probability !== null && lead.probability !== ''
          ? parseInt(lead.probability, 10)
          : 0;
    }

    if (availableColumns.has('expected_close_date')) {
      normalized.expected_close_date = this.parseDateToIsoString(lead.expected_close_date);
    }

    if (availableColumns.has('priority')) {
      normalized.priority = lead.priority ? lead.priority.trim().toLowerCase() : 'medium';
    }

    if (availableColumns.has('notes')) {
      normalized.notes = lead.notes ? lead.notes.trim() : null;
    }

    if (availableColumns.has('assigned_to')) {
      normalized.assigned_to = lead.assigned_to && lead.assigned_to !== '' ? lead.assigned_to : null;
    }

    if (availableColumns.has('pipeline_stage_id')) {
      normalized.pipeline_stage_id =
        lead.pipeline_stage_id && lead.pipeline_stage_id !== '' ? lead.pipeline_stage_id : null;
    }

    if (availableColumns.has('company_id')) {
      normalized.company_id = companyId;
    }

    if (availableColumns.has('created_by')) {
      normalized.created_by = userId;
    }

    const createdAtIso = this.parseDateToIsoString(lead.created_at, nowIso);
    const updatedAtIso = this.parseDateToIsoString(lead.updated_at, nowIso);

    if (availableColumns.has('created_at')) {
      normalized.created_at = createdAtIso;
    }

    if (availableColumns.has('updated_at')) {
      normalized.updated_at = updatedAtIso;
    }

    return normalized;
  }

  /**
   * Safely convert date-like input to ISO string. Returns fallback when parsing fails.
   */
  parseDateToIsoString(value, fallback = null) {
    if (!value) {
      return fallback;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return fallback;
      }
      value = trimmed;
    }

    const parsed =
      value instanceof Date
        ? value
        : new Date(typeof value === 'number' ? value : String(value));

    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }

    return parsed.toISOString();
  }

  /**
   * Export leads to various formats
   */
  async exportLeads(filters = {}, format = 'csv') {
    try {
      console.log('Starting export with filters:', filters, 'format:', format);

      let query = supabaseAdmin
        .from('leads')
        .select(`
          *,
          assigned_user:user_profiles!leads_assigned_to_fkey(first_name, last_name),
          created_user:user_profiles!leads_created_by_fkey(first_name, last_name),
          pipeline_stages(name)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.lead_source) {
        query = query.eq('lead_source', filters.lead_source);
      }

      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.pipeline_stage_id) {
        query = query.eq('pipeline_stage_id', filters.pipeline_stage_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data: leads, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new ApiError(`Failed to fetch leads for export: ${error.message}`, 500);
      }

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
        'Stage': lead.pipeline_stages?.name || '',
        'Deal Value': lead.deal_value || '',
        'Probability': lead.probability || '',
        'Expected Close Date': lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : '',
        'Priority': lead.priority || '',
        'Assigned To': lead.assigned_user ? `${lead.assigned_user.first_name || ''} ${lead.assigned_user.last_name || ''}`.trim() : '',
        'Created By': lead.created_user ? `${lead.created_user.first_name || ''} ${lead.created_user.last_name || ''}`.trim() : '',
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
      let query = supabaseAdmin
        .from('import_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: history, error } = await query;

      if (error) {
        throw new ApiError('Failed to fetch import history', 500);
      }

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
      // Get user's company_id from their profile
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('company_id')
        .eq('id', importData.user_id)
        .single();

      if (profileError || !userProfile?.company_id) {
        console.error('Failed to get user company_id for import history:', profileError);
        return; // Skip logging if we can't get company_id
      }

      const { error } = await supabaseAdmin
        .from('import_history')
        .insert({
          company_id: userProfile.company_id,
          created_by: importData.user_id,
          filename: importData.file_name,
          total_records: importData.total_records,
          successful_records: importData.successful_imports,
          failed_records: importData.failed_imports,
          error_details: importData.errors && importData.errors.length > 0 ? importData.errors : null,
          status: importData.successful_imports > 0 ? 'completed' : 'failed',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log import history:', error);
      }
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
