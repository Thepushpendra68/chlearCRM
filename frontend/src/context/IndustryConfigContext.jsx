import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const IndustryConfigContext = createContext(null);

/**
 * Industry Configuration Provider
 * Loads and provides industry-specific configuration to all components
 */
export const IndustryConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[CONFIG] Fetching industry configuration...');
      const response = await api.get('/config/industry');

      console.log('[CONFIG] Configuration loaded successfully:', response.data.data);
      setConfig(response.data.data);
    } catch (err) {
      console.error('[CONFIG] Failed to load configuration:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get industry-specific terminology
   * @param {string} key - The term key (e.g., 'lead', 'contact', 'deal')
   * @param {boolean} plural - Whether to return plural form
   * @returns {string} The industry-specific term
   */
  const getTerm = (key, plural = false) => {
    if (!config?.config?.terminology) {
      // Fallback to key if config not loaded
      return plural ? `${key}s` : key;
    }

    const terminology = config.config.terminology;

    // Try to get the exact term
    let term = terminology[key];

    // If plural requested, try plural key first, then add 's'
    if (plural) {
      const pluralKey = `${key}s`;
      term = terminology[pluralKey] || (term ? `${term}s` : `${key}s`);
    }

    return term || key;
  };

  /**
   * Get field definition by field name
   * @param {string} fieldName - The field name (e.g., 'firstName', 'studentAge')
   * @returns {object|null} Field definition or null
   */
  const getFieldDefinition = (fieldName) => {
    if (!config?.config) return null;

    // Check core fields first
    if (config.config.coreFields?.[fieldName]) {
      return {
        ...config.config.coreFields[fieldName],
        fieldName,
        isCustom: false,
        category: 'core'
      };
    }

    // Check custom fields
    if (config.config.customFields?.[fieldName]) {
      return {
        ...config.config.customFields[fieldName],
        fieldName,
        isCustom: true,
        category: config.config.customFields[fieldName].category || 'custom'
      };
    }

    return null;
  };

  /**
   * Get all field definitions (core + custom)
   * @returns {object} Object with all field definitions
   */
  const getAllFields = () => {
    if (!config?.config) return {};

    const allFields = {};

    // Add core fields
    if (config.config.coreFields) {
      Object.keys(config.config.coreFields).forEach(key => {
        allFields[key] = {
          ...config.config.coreFields[key],
          fieldName: key,
          isCustom: false,
          category: 'core'
        };
      });
    }

    // Add custom fields
    if (config.config.customFields) {
      Object.keys(config.config.customFields).forEach(key => {
        allFields[key] = {
          ...config.config.customFields[key],
          fieldName: key,
          isCustom: true,
          category: config.config.customFields[key].category || 'custom'
        };
      });
    }

    return allFields;
  };

  /**
   * Get form layout sections
   * @returns {array} Array of form sections with field definitions
   */
  const getFormLayout = () => {
    if (!config?.config?.formLayout?.sections) {
      return [];
    }

    const allFields = getAllFields();

    return config.config.formLayout.sections.map(section => ({
      ...section,
      fields: section.fields.map(fieldName => {
        const field = allFields[fieldName];
        if (!field) {
          console.warn(`[CONFIG] Field ${fieldName} referenced in section ${section.id} but not defined`);
          return null;
        }
        return field;
      }).filter(Boolean) // Remove null fields
    }));
  };

  /**
   * Get pipeline configuration
   * @returns {object} Pipeline configuration
   */
  const getPipelineConfig = () => {
    return config?.config?.pipeline || null;
  };

  /**
   * Get list view configuration
   * @returns {object} List view configuration
   */
  const getListViewConfig = () => {
    return config?.config?.listView || null;
  };

  /**
   * Check if a feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} Whether feature is enabled
   */
  const isFeatureEnabled = (feature) => {
    switch (feature) {
      case 'pipeline':
        return config?.config?.pipeline?.enabled !== false;
      case 'customFields':
        return Object.keys(config?.config?.customFields || {}).length > 0;
      default:
        return false;
    }
  };

  const value = {
    // State
    config: config?.config,
    company: config?.company,
    loading,
    error,

    // Actions
    refetch: fetchConfig,

    // Helper functions
    getTerm,
    getFieldDefinition,
    getAllFields,
    getFormLayout,
    getPipelineConfig,
    getListViewConfig,
    isFeatureEnabled
  };

  return (
    <IndustryConfigContext.Provider value={value}>
      {children}
    </IndustryConfigContext.Provider>
  );
};

/**
 * Hook to access industry configuration
 * Must be used within IndustryConfigProvider
 */
export const useIndustryConfig = () => {
  const context = useContext(IndustryConfigContext);

  if (!context) {
    throw new Error('useIndustryConfig must be used within IndustryConfigProvider');
  }

  return context;
};

export default IndustryConfigContext;
