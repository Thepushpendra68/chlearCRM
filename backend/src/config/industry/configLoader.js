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
 * Validate custom fields data against configuration
 * @param {object} config - Industry configuration
 * @param {object} customFieldsData - Custom fields data to validate
 * @returns {object} Validation result { valid: boolean, errors: array }
 */
function validateCustomFields(config, customFieldsData) {
  const errors = [];

  if (!customFieldsData || typeof customFieldsData !== 'object') {
    return { valid: true, errors: [] }; // Empty is valid
  }

  // Check each custom field in the data
  Object.keys(customFieldsData).forEach(fieldName => {
    const fieldDef = config.customFields ? config.customFields[fieldName] : null;
    const value = customFieldsData[fieldName];

    // Skip validation if field not in config (allow extra fields)
    if (!fieldDef) {
      return;
    }

    // Check required fields
    if (fieldDef.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldDef.label} is required`,
      });
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== '') {
      switch (fieldDef.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must be a number`,
            });
          }
          if (fieldDef.min !== undefined && Number(value) < fieldDef.min) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must be at least ${fieldDef.min}`,
            });
          }
          if (fieldDef.max !== undefined && Number(value) > fieldDef.max) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must be at most ${fieldDef.max}`,
            });
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must be a valid email address`,
            });
          }
          break;

        case 'tel':
          if (fieldDef.validation && fieldDef.validation.pattern) {
            if (!fieldDef.validation.pattern.test(value)) {
              errors.push({
                field: fieldName,
                message: fieldDef.validation.message || `${fieldDef.label} format is invalid`,
              });
            }
          }
          break;

        case 'text':
        case 'textarea':
          if (fieldDef.maxLength && value.length > fieldDef.maxLength) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must not exceed ${fieldDef.maxLength} characters`,
            });
          }
          if (fieldDef.validation && fieldDef.validation.pattern) {
            if (!fieldDef.validation.pattern.test(value)) {
              errors.push({
                field: fieldName,
                message: fieldDef.validation.message || `${fieldDef.label} format is invalid`,
              });
            }
          }
          break;

        case 'select':
          if (fieldDef.options && Array.isArray(fieldDef.options)) {
            const validValues = fieldDef.options.map(opt => opt.value);
            if (!validValues.includes(value)) {
              errors.push({
                field: fieldName,
                message: `${fieldDef.label} has an invalid value`,
              });
            }
          }
          break;

        case 'multiselect':
          if (!Array.isArray(value)) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must be an array`,
            });
          } else if (fieldDef.options) {
            const validValues = fieldDef.options.map(opt => opt.value);
            const invalidValues = value.filter(v => !validValues.includes(v));
            if (invalidValues.length > 0) {
              errors.push({
                field: fieldName,
                message: `${fieldDef.label} contains invalid values: ${invalidValues.join(', ')}`,
              });
            }
          }
          break;

        case 'date':
        case 'datetime':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            errors.push({
              field: fieldName,
              message: `${fieldDef.label} must be a valid date`,
            });
          }
          break;
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
  validateCustomFields,
  validateConfig,
  getAvailableIndustries,
  clearCache,
};
