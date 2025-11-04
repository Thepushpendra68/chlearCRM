import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const IndustryConfigContext = createContext();

/**
 * IndustryConfigProvider - Loads and provides industry configuration to all components
 * Fetches configuration from backend API based on user's company
 */
export const IndustryConfigProvider = ({ children }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      // Don't load config until user is authenticated
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch configuration from backend
        const response = await api.get('/config/industry');
        
        console.log('📋 [CONFIG] API Response received:', response.data);
        
        if (response.data && response.data.success) {
          console.log('✅ [CONFIG] Configuration loaded successfully');
          console.log('📋 [CONFIG] Industry Type:', response.data.data?.config?.industryType);
          console.log('📋 [CONFIG] Core Fields:', Object.keys(response.data.data?.config?.coreFields || {}));
          console.log('📋 [CONFIG] Form Layout Sections:', response.data.data?.config?.formLayout?.sections?.map(s => s.id));
          setConfig(response.data.data);
        } else {
          throw new Error('Invalid configuration response');
        }
      } catch (err) {
        console.error('❌ [CONFIG] Failed to load industry configuration:', err);
        setError(err.message || 'Failed to load configuration');
        
        // Set fallback configuration
        setConfig({
          config: {
            industryType: 'generic',
            industryName: 'Generic CRM',
            terminology: {
              lead: 'Lead',
              leads: 'Leads',
              contact: 'Contact',
              contacts: 'Contacts',
              company: 'Company',
              companies: 'Companies',
              deal: 'Deal',
              deals: 'Deals',
              pipeline: 'Pipeline',
              stage: 'Stage',
              stages: 'Stages',
              activity: 'Activity',
              activities: 'Activities',
            },
            coreFields: {},
            customFields: {},
            formLayout: { sections: [] },
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [user]);

  /**
   * Get terminology label for a given key
   * @param {string} key - Terminology key (e.g., 'lead', 'leads', 'pipeline')
   * @param {string} fallback - Fallback value if key not found
   * @returns {string} Terminology label
   */
  const getTerminology = (key, fallback = null) => {
    if (!config || !config.config || !config.config.terminology) {
      return fallback || key;
    }
    return config.config.terminology[key] || fallback || key;
  };

  /**
   * Get all fields (core + custom) as an array
   * @returns {array} Array of field definitions
   */
  const getFields = () => {
    if (!config || !config.config) return [];
    
    const fields = [];
    const cfg = config.config;

    // Add core fields
    if (cfg.coreFields && typeof cfg.coreFields === 'object') {
      Object.keys(cfg.coreFields).forEach(key => {
        const fieldDef = cfg.coreFields[key];
        fields.push({
          id: key, // Use the camelCase key as ID for form binding
          name: fieldDef.name || key, // Database column name (snake_case)
          ...fieldDef,
          isCustomField: false,
          fieldKey: key,
        });
      });
    }

    // Add custom fields
    if (cfg.customFields && typeof cfg.customFields === 'object') {
      Object.keys(cfg.customFields).forEach(key => {
        const fieldDef = cfg.customFields[key];
        fields.push({
          id: key, // Use the camelCase key as ID for form binding
          name: fieldDef.name || key, // Database column name (snake_case)
          ...fieldDef,
          isCustomField: true,
          fieldKey: key,
        });
      });
    }

    return fields;
  };

  /**
   * Get field definition by ID
   * @param {string} fieldId - Field identifier
   * @returns {object|null} Field definition or null
   */
  const getFieldById = (fieldId) => {
    const allFields = getFields();
    return allFields.find(f => f.id === fieldId) || null;
  };

  /**
   * Get fields for a specific section
   * @param {string} sectionId - Section identifier
   * @returns {array} Array of field definitions for the section
   */
  const getSectionFields = (sectionId) => {
    if (!config || !config.config || !config.config.formLayout) return [];
    
    const section = config.config.formLayout.sections?.find(s => s.id === sectionId);
    if (!section) return [];

    return section.fields.map(fieldId => getFieldById(fieldId)).filter(Boolean);
  };

  /**
   * Reload configuration from server
   */
  const refetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/industry');
      
      if (response.data && response.data.success) {
        setConfig(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to reload configuration:', err);
      setError(err.message || 'Failed to reload configuration');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    config: config?.config || null,
    company: config?.company || null,
    loading,
    error,
    refetchConfig,
    
    // Helper functions
    getTerminology,
    getFields,
    getFieldById,
    getSectionFields,
    
    // Shortcuts
    industryType: config?.config?.industryType || 'generic',
    terminology: config?.config?.terminology || {},
    formLayout: config?.config?.formLayout || null,
  };

  return (
    <IndustryConfigContext.Provider value={value}>
      {children}
    </IndustryConfigContext.Provider>
  );
};

/**
 * Hook to use industry configuration
 * @returns {object} Industry configuration context
 */
export const useIndustryConfig = () => {
  const context = useContext(IndustryConfigContext);
  if (!context) {
    throw new Error('useIndustryConfig must be used within IndustryConfigProvider');
  }
  return context;
};

export default IndustryConfigContext;
