import api from '../config/api';

/**
 * Get all custom field definitions
 * @param {Object} filters - Optional filters (entity_type, is_active, data_type, search)
 * @returns {Promise<Array>} Array of custom field definitions
 */
export const getCustomFields = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    if (filters.data_type) params.append('data_type', filters.data_type);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/custom-fields?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    throw error;
  }
};

/**
 * Get a single custom field definition by ID
 * @param {string} fieldId - Custom field ID
 * @returns {Promise<Object>} Custom field definition
 */
export const getCustomFieldById = async (fieldId) => {
  try {
    const response = await api.get(`/custom-fields/${fieldId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching custom field:', error);
    throw error;
  }
};

/**
 * Create a new custom field definition
 * @param {Object} fieldData - Custom field data
 * @returns {Promise<Object>} Created custom field
 */
export const createCustomField = async (fieldData) => {
  try {
    const response = await api.post('/custom-fields', fieldData);
    return response.data;
  } catch (error) {
    console.error('Error creating custom field:', error);
    throw error;
  }
};

/**
 * Update a custom field definition
 * @param {string} fieldId - Custom field ID
 * @param {Object} fieldData - Updated custom field data
 * @returns {Promise<Object>} Updated custom field
 */
export const updateCustomField = async (fieldId, fieldData) => {
  try {
    const response = await api.put(`/custom-fields/${fieldId}`, fieldData);
    return response.data;
  } catch (error) {
    console.error('Error updating custom field:', error);
    throw error;
  }
};

/**
 * Delete a custom field definition
 * @param {string} fieldId - Custom field ID
 * @returns {Promise<Object>} Success response
 */
export const deleteCustomField = async (fieldId) => {
  try {
    const response = await api.delete(`/custom-fields/${fieldId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting custom field:', error);
    throw error;
  }
};

/**
 * Reorder custom fields
 * @param {string} entityType - Entity type (lead, contact, company, etc.)
 * @param {Array} fieldOrders - Array of { id, display_order } objects
 * @returns {Promise<Object>} Success response
 */
export const reorderCustomFields = async (entityType, fieldOrders) => {
  try {
    const response = await api.post('/custom-fields/reorder', {
      entity_type: entityType,
      field_orders: fieldOrders
    });
    return response.data;
  } catch (error) {
    console.error('Error reordering custom fields:', error);
    throw error;
  }
};

/**
 * Get custom field usage statistics
 * @param {string} fieldId - Custom field ID
 * @returns {Promise<Object>} Usage statistics
 */
export const getCustomFieldUsage = async (fieldId) => {
  try {
    const response = await api.get(`/custom-fields/${fieldId}/usage`);
    return response.data;
  } catch (error) {
    console.error('Error fetching custom field usage:', error);
    throw error;
  }
};

/**
 * Get all custom fields usage statistics
 * @param {string} entityType - Entity type (lead, contact, company, etc.)
 * @returns {Promise<Array>} Array of usage statistics
 */
export const getAllCustomFieldsUsage = async (entityType) => {
  try {
    const response = await api.get(`/custom-fields/usage/all?entity_type=${entityType}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all custom fields usage:', error);
    throw error;
  }
};

/**
 * Validate custom fields
 * @param {string} entityType - Entity type (lead, contact, company, etc.)
 * @param {Object} customFields - Custom fields object to validate
 * @returns {Promise<Object>} Validation result { valid: boolean, errors: [] }
 */
export const validateCustomFields = async (entityType, customFields) => {
  try {
    const response = await api.post('/custom-fields/validate', {
      entity_type: entityType,
      custom_fields: customFields
    });
    return response.data;
  } catch (error) {
    console.error('Error validating custom fields:', error);
    throw error;
  }
};

/**
 * Data type options for custom fields
 */
export const DATA_TYPES = [
  { value: 'text', label: 'Text (Single Line)', icon: '📝' },
  { value: 'textarea', label: 'Text Area (Multiple Lines)', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'decimal', label: 'Decimal', icon: '💰' },
  { value: 'boolean', label: 'Yes/No (Boolean)', icon: '✅' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'Date & Time', icon: '🕐' },
  { value: 'select', label: 'Dropdown (Single Select)', icon: '📋' },
  { value: 'multiselect', label: 'Dropdown (Multi-Select)', icon: '☑️' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone Number', icon: '📞' },
  { value: 'url', label: 'URL/Website', icon: '🔗' },
  { value: 'currency', label: 'Currency', icon: '💵' }
];

/**
 * Entity type options for custom fields
 */
export const ENTITY_TYPES = [
  { value: 'lead', label: 'Leads' },
  { value: 'contact', label: 'Contacts' },
  { value: 'company', label: 'Companies' },
  { value: 'deal', label: 'Deals' },
  { value: 'task', label: 'Tasks' },
  { value: 'activity', label: 'Activities' }
];

/**
 * Helper function to format field name (snake_case to Title Case)
 */
export const formatFieldName = (fieldName) => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Helper function to format field value based on data type
 */
export const formatFieldValue = (value, dataType) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  switch (dataType) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    
    case 'date':
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    
    case 'datetime':
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    
    case 'currency':
    case 'decimal':
      return typeof value === 'number' ? value.toLocaleString() : value;
    
    case 'multiselect':
      return Array.isArray(value) ? value.join(', ') : value;
    
    default:
      return typeof value === 'object' ? JSON.stringify(value) : value;
  }
};

export default {
  getCustomFields,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
  getCustomFieldUsage,
  getAllCustomFieldsUsage,
  validateCustomFields,
  DATA_TYPES,
  ENTITY_TYPES,
  formatFieldName,
  formatFieldValue
};

