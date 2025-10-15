const { supabaseAdmin } = require('../config/supabase');

const DEFAULT_CONFIG_VERSION = 1;
const DEFAULT_CONFIG = {
  version: DEFAULT_CONFIG_VERSION,
  requiredFields: ['first_name', 'last_name'],
  optionalFields: [
    'email',
    'phone',
    'company',
    'job_title',
    'lead_source',
    'status',
    'deal_value',
    'probability',
    'expected_close_date',
    'priority',
    'notes',
    'assigned_to',
    'pipeline_stage_id'
  ],
  enums: {
    status: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    lead_source: ['website', 'referral', 'cold_call', 'social_media', 'advertisement', 'other', 'import'],
    priority: ['low', 'medium', 'high', 'urgent']
  },
  duplicateStrategy: {
    default: 'skip',
    supported: ['skip', 'update']
  },
  numericRanges: {
    deal_value: { min: 0, inclusive: true },
    probability: { min: 0, max: 100, inclusive: true }
  }
};

class ImportConfigService {
  constructor() {
    this.cache = new Map();
  }

  async getCompanyConfig(companyId) {
    if (!companyId) {
      return DEFAULT_CONFIG;
    }

    if (this.cache.has(companyId)) {
      return this.cache.get(companyId);
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('import_configs')
        .select('schema_json, duplicate_policy_default, version')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          return DEFAULT_CONFIG;
        }
        throw error;
      }

      if (!data?.schema_json) {
        this.cache.set(companyId, DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }

      const mergedConfig = this.mergeWithDefaults(data.schema_json, data.duplicate_policy_default, data.version);
      this.cache.set(companyId, mergedConfig);
      return mergedConfig;
    } catch (error) {
      console.warn('Failed to fetch company import config, using defaults', error);
      this.cache.set(companyId, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  }

  mergeWithDefaults(schemaJson, duplicatePolicyDefault, version) {
    const normalizedEnums = {
      status: schemaJson?.enums?.status || DEFAULT_CONFIG.enums.status,
      lead_source: schemaJson?.enums?.lead_source || DEFAULT_CONFIG.enums.lead_source,
      priority: schemaJson?.enums?.priority || DEFAULT_CONFIG.enums.priority
    };

    return {
      version: version || DEFAULT_CONFIG_VERSION,
      requiredFields: schemaJson?.requiredFields || DEFAULT_CONFIG.requiredFields,
      optionalFields: schemaJson?.optionalFields || DEFAULT_CONFIG.optionalFields,
      enums: normalizedEnums,
      duplicateStrategy: {
        default: duplicatePolicyDefault || DEFAULT_CONFIG.duplicateStrategy.default,
        supported: schemaJson?.duplicateStrategy?.supported || DEFAULT_CONFIG.duplicateStrategy.supported
      },
      numericRanges: {
        deal_value: schemaJson?.numericRanges?.deal_value || DEFAULT_CONFIG.numericRanges.deal_value,
        probability: schemaJson?.numericRanges?.probability || DEFAULT_CONFIG.numericRanges.probability
      }
    };
  }

  invalidateCache(companyId) {
    if (companyId) {
      this.cache.delete(companyId);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new ImportConfigService();
