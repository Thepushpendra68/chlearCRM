/**
 * Industry Configuration Loader
 * Dynamically loads the appropriate industry configuration based on company settings.
 * Caches configurations in memory for performance.
 */

const baseConfig = require('./base.config');

// Configuration cache to avoid re-loading files
const configCache = new Map();

/**
 * Load industry configuration for a company
 * @param {string} industryType - Industry type identifier (e.g., 'school', 'real_estate', 'generic')
 * @returns {object} Industry configuration object
 */
function loadIndustryConfig(industryType) {
  // Normalize industry type
  const normalizedType = (industryType || 'generic').toLowerCase().trim();

  // Check cache first
  if (configCache.has(normalizedType)) {
    console.log(`📦 [CONFIG] Loaded ${normalizedType} config from cache`);
    return configCache.get(normalizedType);
  }

  let config;

  try {
    // Try to load industry-specific config
    if (normalizedType !== 'generic') {
      try {
        config = require(`./${normalizedType}.config.js`);
        console.log(`✅ [CONFIG] Loaded ${normalizedType} industry configuration`);
      } catch (error) {
        // If industry config doesn't exist, fall back to base
        console.warn(`⚠️ [CONFIG] No configuration found for industry: ${normalizedType}`);
        console.warn(`⚠️ [CONFIG] Falling back to base (generic) configuration`);
        config = baseConfig;
      }
    } else {
      // Generic/default config
      config = baseConfig;
      console.log(`✅ [CONFIG] Loaded base (generic) configuration`);
    }

    // Validate configuration structure
    if (!validateConfig(config)) {
      console.error(`❌ [CONFIG] Invalid configuration for ${normalizedType}, using base config`);
      config = baseConfig;
    }

    // Cache the configuration
    configCache.set(normalizedType, config);

    return config;
  } catch (error) {
    console.error(`❌ [CONFIG] Error loading configuration for ${normalizedType}:`, error);
    console.log(`🔄 [CONFIG] Falling back to base configuration`);
    return baseConfig;
  }
}

/**
 * Get configuration for a specific company
 * @param {object} company - Company object with industry_type field
 * @returns {object} Industry configuration
 */
function getConfigForCompany(company) {
  if (!company) {
    console.warn('⚠️ [CONFIG] No company provided, using base configuration');
    return baseConfig;
  }

  const industryType = company.industry_type || 'generic';
  return loadIndustryConfig(industryType);
}

/**
 * Get field definition (core or custom)
 * @param {object} config - Industry configuration
 * @param {string} fieldName - Field name to look up
 * @returns {object|null} Field definition or null if not found
 */
function getFieldDefinition(config, fieldName) {
  // Check core fields first
  if (config.coreFields && config.coreFields[fieldName]) {
    return {
      ...config.coreFields[fieldName],
      isCustom: false,
      category: 'core',
    };
  }

  // Check custom fields
  if (config.customFields && config.customFields[fieldName]) {
    return {
      ...config.customFields[fieldName],
      isCustom: true,
      category: config.customFields[fieldName].category || 'custom',
    };
  }

  return null;
}

/**
 * Get all fields (core + custom) for a configuration
 * @param {object} config - Industry configuration
 * @returns {object} Object containing all field definitions
 */
function getAllFields(config) {
  const allFields = {};

  // Add all core fields
  if (config.coreFields) {
    Object.keys(config.coreFields).forEach(key => {
      allFields[key] = {
        ...config.coreFields[key],
        isCustom: false,
        category: 'core',
      };
    });
  }

  // Add all custom fields
  if (config.customFields) {
    Object.keys(config.customFields).forEach(key => {
      allFields[key] = {
        ...config.customFields[key],
        isCustom: true,
        category: config.customFields[key].category || 'custom',
      };
    });
  }

  return allFields;
}

/**
 * Get fields for a specific form section
 * @param {object} config - Industry configuration
 * @param {string} sectionId - Section ID (e.g., 'student_info', 'parent_info')
 * @returns {array} Array of field definitions for the section
 */
function getFieldsForSection(config, sectionId) {
  if (!config.formLayout || !config.formLayout.sections) {
    return [];
  }

  const section = config.formLayout.sections.find(s => s.id === sectionId);
  if (!section || !section.fields) {
    return [];
  }

  const allFields = getAllFields(config);

  return section.fields.map(fieldName => {
    const field = allFields[fieldName];
    if (!field) {
      console.warn(`⚠️ [CONFIG] Field ${fieldName} referenced in section ${sectionId} but not defined`);
      return null;
    }
    return { ...field, fieldName };
  }).filter(Boolean);
}

/**
 * Get formatted form layout with field definitions
 * @param {object} config - Industry configuration
 * @returns {array} Array of sections with populated field definitions
 */
function getFormLayout(config) {
  if (!config.formLayout || !config.formLayout.sections) {
    return [];
  }

  const allFields = getAllFields(config);

  return config.formLayout.sections.map(section => ({
    ...section,
    fields: section.fields.map(fieldName => {
      const field = allFields[fieldName];
      if (!field) {
        console.warn(`⚠️ [CONFIG] Field ${fieldName} referenced in section ${section.id} but not defined`);
        return null;
      }
      return { ...field, fieldName };
    }).filter(Boolean),
  }));
}

/**
 * Get validation schema for all fields
 * @param {object} config - Industry configuration
 * @returns {object} Validation schema
 */
function getValidationSchema(config) {
  const allFields = getAllFields(config);
  const schema = {};

  Object.keys(allFields).forEach(key => {
    const field = allFields[key];
    if (field.validation) {
      schema[key] = field.validation;
    }
  });

  return schema;
}

/**
 * Validate data against configuration
 * @param {object} config - Industry configuration
 * @param {object} data - Data to validate
 * @returns {object} Validation result { valid: boolean, errors: array }
 */
function validateData(config, data) {
  const errors = [];
  const schema = getValidationSchema(config);

  Object.keys(schema).forEach(fieldName => {
    const fieldDef = getFieldDefinition(config, fieldName);
    const rules = schema[fieldName];
    const value = data[fieldName];

    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: fieldName,
        message: rules.message || `${fieldDef.label} is required`,
      });
    }

    if (value !== null && value !== undefined && value !== '') {
      if (rules.minLength && String(value).length < rules.minLength) {
        errors.push({
          field: fieldName,
          message: rules.message || `${fieldDef.label} must be at least ${rules.minLength} characters`,
        });
      }

      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push({
          field: fieldName,
          message: rules.message || `${fieldDef.label} must not exceed ${rules.maxLength} characters`,
        });
      }

      if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
        errors.push({
          field: fieldName,
          message: rules.message || `${fieldDef.label} format is invalid`,
        });
      }

      if (rules.min !== undefined && Number(value) < rules.min) {
        errors.push({
          field: fieldName,
          message: rules.message || `${fieldDef.label} must be at least ${rules.min}`,
        });
      }

      if (rules.max !== undefined && Number(value) > rules.max) {
        errors.push({
          field: fieldName,
          message: rules.message || `${fieldDef.label} must be at most ${rules.max}`,
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate configuration structure
 * @param {object} config - Configuration object to validate
 * @returns {boolean} True if valid
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    console.error('❌ [CONFIG] Configuration is not an object');
    return false;
  }

  // Required properties
  const requiredProps = ['industryType', 'industryName', 'terminology', 'coreFields'];
  for (const prop of requiredProps) {
    if (!config[prop]) {
      console.error(`❌ [CONFIG] Configuration missing required property: ${prop}`);
      return false;
    }
  }

  // Validate terminology has required labels
  const requiredTerms = ['lead', 'leads'];
  for (const term of requiredTerms) {
    if (!config.terminology[term]) {
      console.error(`❌ [CONFIG] Configuration missing required terminology: ${term}`);
      return false;
    }
  }

  return true;
}

/**
 * Get list of available industry configurations
 * @returns {array} Array of available industry types
 */
function getAvailableIndustries() {
  const fs = require('fs');
  const path = require('path');

  try {
    const configDir = __dirname;
    const files = fs.readdirSync(configDir);

    const industries = files
      .filter(file => file.endsWith('.config.js') && file !== 'base.config.js')
      .map(file => {
        const industryType = file.replace('.config.js', '');
        try {
          const config = require(path.join(configDir, file));
          return {
            type: industryType,
            name: config.industryName || industryType,
          };
        } catch (error) {
          console.error(`❌ [CONFIG] Error loading ${file}:`, error);
          return null;
        }
      })
      .filter(Boolean);

    // Always include base/generic
    industries.unshift({
      type: 'generic',
      name: 'Generic CRM',
    });

    return industries;
  } catch (error) {
    console.error('❌ [CONFIG] Error reading industry configurations:', error);
    return [{ type: 'generic', name: 'Generic CRM' }];
  }
}

/**
 * Clear configuration cache (useful for testing or config updates)
 */
function clearCache() {
  configCache.clear();
  console.log('🧹 [CONFIG] Configuration cache cleared');
}

module.exports = {
  loadIndustryConfig,
  getConfigForCompany,
  getFieldDefinition,
  getAllFields,
  getFieldsForSection,
  getFormLayout,
  getValidationSchema,
  validateData,
  validateConfig,
  getAvailableIndustries,
  clearCache,
};
