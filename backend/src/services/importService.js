const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const csvParser = require('../utils/csvParser');
const excelParser = require('../utils/excelParser');
const importConfigService = require('./importConfigService');
const ImportValidationEngine = require('./importValidationEngine');
const { parseDateFlexible } = require('./importValidationEngine');
const importTelemetryService = require('./importTelemetryService');

const normalizeString = value => (typeof value === 'string' ? value.trim() : value);
const normalizeEmail = value => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
};
const normalizePhone = value => {
  const normalized = normalizeString(value);
  return normalized ? normalized.replace(/[\s\-\(\)]/g, '') : null;
};
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

class ImportService {
  constructor() {
    this.leadsTableColumns = null;
  }

  /**
   * Parse uploaded file buffer into lead objects using the appropriate parser.
   */
  async parseLeadsFromFile(fileBuffer, fileName, fieldMapping = {}) {
    let leads = [];

    if (fileName.endsWith('.csv')) {
      leads = await csvParser.parseCSV(fileBuffer, fieldMapping);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      leads = await excelParser.parseExcel(fileBuffer, fieldMapping);
    } else {
      throw new ApiError('Unsupported file format. Please use CSV or Excel files.', 400);
    }

    return leads;
  }

  /**
   * Build duplicate lookup context for a set of leads.
   */
  async buildDuplicateContext(leads, companyId) {
    const emailCandidates = new Set();
    const phoneCandidates = new Set();

    leads.forEach(lead => {
      const email = normalizeEmail(lead.email);
      if (email) {
        emailCandidates.add(email);
      }

      const phone = normalizePhone(lead.phone);
      if (phone) {
        phoneCandidates.add(phone);
      }
    });

    if (!companyId || (emailCandidates.size === 0 && phoneCandidates.size === 0)) {
      return {
        emails: new Set(),
        phones: new Set()
      };
    }

    const [existingEmails, existingPhones] = await Promise.all([
      this.fetchExistingValues(companyId, Array.from(emailCandidates), 'email'),
      this.fetchExistingValues(companyId, Array.from(phoneCandidates), 'phone')
    ]);

    return {
      emails: new Set(existingEmails.map(record => normalizeEmail(record.email))),
      phones: new Set(existingPhones.map(record => normalizePhone(record.phone)))
    };
  }

  /**
   * Fetch existing leads with matching values for the provided column.
   */
  async fetchExistingValues(companyId, values, column) {
    if (!companyId || !Array.isArray(values) || values.length === 0) {
      return [];
    }

    const sanitizedValues = values.filter(value => value !== null && value !== undefined && value !== '');

    if (sanitizedValues.length === 0) {
      return [];
    }

    if (typeof supabaseAdmin?.from !== 'function') {
      console.warn('[IMPORT] Supabase admin client unavailable. Skipping duplicate lookup for column:', column);
      return [];
    }

    const chunks = chunkArray(sanitizedValues, 500);
    const results = [];

    for (const chunk of chunks) {
      try {
        const queryBuilder = supabaseAdmin.from('leads');

        if (!queryBuilder || typeof queryBuilder.select !== 'function') {
          console.warn('[IMPORT] Supabase query builder unavailable. Skipping duplicate lookup for column:', column);
          return [];
        }

        let query = queryBuilder
          .select('id, email, phone')
          .eq('company_id', companyId);

        if (chunk.length === 1) {
          query = query.eq(column, chunk[0]);
        } else {
          query = query.in(column, chunk);
        }

        const { data, error } = await query;

        if (error) {
          if (error.code === '42P01') {
            return [];
          }
          throw error;
        }

        if (data) {
          results.push(...data);
        }
      } catch (error) {
        console.error(`Failed to fetch existing ${column} values`, error);
        throw new ApiError('Could not validate duplicate records. Please try again later.', 500);
      }
    }

    return results;
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
    const parseStartedAt = Date.now();

    try {
      const leads = await this.parseLeadsFromFile(fileBuffer, fileName, options.fieldMapping);
      const parseDurationMs = Date.now() - parseStartedAt;

      // Validate leads data
      const companyId = await this.getUserCompanyId(userId);
      const validationStartedAt = Date.now();
      const validationResult = await this.validateLeads(leads, companyId, options);
      const validationDurationMs = Date.now() - validationStartedAt;

      if (options.mode && options.mode.toLowerCase() === 'dry_run') {
        await importTelemetryService.recordDryRun({
          companyId,
          userId,
          fileName,
          stats: validationResult.stats,
          warningCount: validationResult.warnings?.length || 0,
          errorCount: validationResult.errors?.length || 0,
          duplicatePolicy: options.duplicate_policy || null,
          configVersion: validationResult.config?.version || null,
          durationMs: validationDurationMs + parseDurationMs,
          metadata: {
            row_count: leads.length
          }
        });

        return {
          total_records: leads.length,
          successful_imports: 0,
          failed_imports: validationResult.stats.invalid,
          validation_errors: validationResult.errors,
          validation_warnings: validationResult.warnings,
          stats: validationResult.stats,
          config_version: validationResult.config?.version || null,
          timings: {
            parse_ms: parseDurationMs,
            validation_ms: validationDurationMs,
            insert_ms: 0
          },
          config: validationResult.config,
          rows: validationResult.rows
        };
      }

      // Import leads to database
      let importResult = { successful: 0, failed: 0, errors: [] };

      let insertDurationMs = 0;
      if (validationResult.validatedLeads.length > 0) {
        const insertStartedAt = Date.now();
        importResult = await this.bulkInsertLeads(validationResult.validatedLeads, userId, companyId);
        insertDurationMs = Date.now() - insertStartedAt;
      }

      const failedCount = validationResult.errors.length + importResult.failed;

      const timings = {
        parse_ms: parseDurationMs,
        validation_ms: validationDurationMs,
        insert_ms: insertDurationMs
      };
      
      // Log import history
      await this.logImportHistory({
        user_id: userId,
        file_name: fileName,
        total_records: leads.length,
        successful_imports: importResult.successful,
        failed_imports: failedCount,
        errors: importResult.errors.concat(validationResult.errors || []),
        validation_errors: validationResult.errors,
        validation_warnings: validationResult.warnings,
        mode: options.mode || 'apply',
        config_version: validationResult.config?.version || null,
        duplicate_policy: options.duplicate_policy || null,
        stats: validationResult.stats,
        timings
      });

      await importTelemetryService.recordImport({
        companyId,
        userId,
        fileName,
        stats: validationResult.stats,
        warningCount: validationResult.warnings?.length || 0,
        errorCount: failedCount,
        duplicatePolicy: options.duplicate_policy || null,
        configVersion: validationResult.config?.version || null,
        durationMs: timings.parse_ms + timings.validation_ms + timings.insert_ms,
        metadata: {
          inserted_count: importResult.successful,
          failed_count: failedCount,
          attempted_count: leads.length
        }
      });

      // Return data with frontend-compatible field names
      return {
        total_records: leads.length,
        successful_imports: importResult.successful,
        failed_imports: failedCount,
        errors: importResult.errors,
        validation_errors: validationResult.errors || [],
        validation_warnings: validationResult.warnings || [],
        stats: validationResult.stats,
        timings,
        config_version: validationResult.config?.version || null,
        config: validationResult.config
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to import leads', 500);
    }
  }

  async dryRunLeads(fileBuffer, fileName, userId, options = {}) {
    return this.importLeads(fileBuffer, fileName, userId, {
      ...options,
      mode: 'dry_run'
    });
  }

  /**
   * Validate leads data
   */
  async validateLeads(leads, companyId = null, options = {}) {
    // Clear the import config cache to ensure we get fresh picklist data
    importConfigService.invalidateCache(companyId);
    
    const config = await importConfigService.getCompanyConfig(companyId);
    const engine = new ImportValidationEngine(config);
    const duplicateLookup = await this.buildDuplicateContext(leads, companyId);

    const context = {
      duplicates: {
        inFile: {
          emails: new Set(),
          phones: new Set()
        },
        inDb: duplicateLookup
      }
    };

    const rowResults = engine.validateRows(leads, context);

    const validatedLeads = [];
    const errors = [];
    const warnings = [];

    rowResults.forEach(result => {
      if (result.isValid) {
        const now = new Date();
        validatedLeads.push({
          ...result.normalized,
          created_at: now,
          updated_at: now
        });
      } else {
        errors.push({
          row: result.rowNumber,
          data: result.raw,
          errors: result.errors
        });
      }

      if (result.warnings.length > 0) {
        warnings.push({
          row: result.rowNumber,
          data: result.raw,
          warnings: result.warnings
        });
      }
    });

    return {
      config,
      rows: rowResults,
      validatedLeads,
      errors,
      warnings,
      stats: {
        total: leads.length,
        valid: validatedLeads.length,
        invalid: errors.length
      }
    };
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

    const parsed = parseDateFlexible(value);

    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }

    return parsed.toISOString();
  }

  /**
   * Export leads to various formats
   */
  async exportLeads(filters = {}, format = 'csv', companyId = null, context = {}) {
    try {
      console.log('Starting export with filters:', filters, 'format:', format, 'companyId:', companyId, 'context:', context);

      if (!companyId) {
        throw new ApiError('Company context is required for exporting leads', 400);
      }

      let query = supabaseAdmin
        .from('leads')
        .select(`
          *,
          assigned_user:user_profiles!leads_assigned_to_fkey(first_name, last_name),
          created_user:user_profiles!leads_created_by_fkey(first_name, last_name),
          pipeline_stages(name)
        `);

      query = query.eq('company_id', companyId);

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
          validation_errors: importData.validation_errors && importData.validation_errors.length > 0 ? importData.validation_errors : null,
          validation_warnings: importData.validation_warnings && importData.validation_warnings.length > 0 ? importData.validation_warnings : null,
          mode: importData.mode || 'apply',
          duplicate_policy: importData.duplicate_policy || null,
          config_version: importData.config_version || null,
          summary: importData.stats
            ? {
                stats: importData.stats,
                warnings: importData.validation_warnings ? importData.validation_warnings.length : 0,
                errors: importData.validation_errors ? importData.validation_errors.length : 0,
                timings: importData.timings || null
              }
            : importData.timings
              ? { timings: importData.timings }
              : null,
          error_report_url: importData.error_report_url || null,
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
