const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Get all custom field definitions for a company
 */
const getCustomFields = async (companyId, filters = {}) => {
  try {
    let query = supabaseAdmin
      .from('custom_field_definitions')
      .select('*')
      .eq('company_id', companyId)
      .order('display_order', { ascending: true });

    // Apply filters
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.data_type) {
      query = query.eq('data_type', filters.data_type);
    }

    if (filters.search) {
      query = query.or(`field_name.ilike.%${filters.search}%,field_label.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    throw new ApiError('Failed to fetch custom fields', 500);
  }
};

/**
 * Get a single custom field definition by ID
 */
const getCustomFieldById = async (companyId, fieldId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_field_definitions')
      .select('*')
      .eq('id', fieldId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApiError('Custom field not found', 404);
      }
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error fetching custom field:', error);
    throw new ApiError('Failed to fetch custom field', 500);
  }
};

/**
 * Create a new custom field definition
 */
const createCustomField = async (companyId, fieldData, userId) => {
  try {
    // Validate field name (alphanumeric and underscores only)
    const fieldNameRegex = /^[a-z][a-z0-9_]*$/;
    if (!fieldNameRegex.test(fieldData.field_name)) {
      throw new ApiError(
        'Field name must start with a letter and contain only lowercase letters, numbers, and underscores',
        400
      );
    }

    // Check if field name already exists for this entity type
    const { data: existing } = await supabaseAdmin
      .from('custom_field_definitions')
      .select('id')
      .eq('company_id', companyId)
      .eq('entity_type', fieldData.entity_type)
      .eq('field_name', fieldData.field_name)
      .single();

    if (existing) {
      throw new ApiError(
        `A custom field with name "${fieldData.field_name}" already exists for ${fieldData.entity_type}`,
        409
      );
    }

    // Validate field options for select/multiselect
    if (['select', 'multiselect'].includes(fieldData.data_type)) {
      if (!fieldData.field_options || !Array.isArray(fieldData.field_options) || fieldData.field_options.length === 0) {
        throw new ApiError('Field options are required for select/multiselect fields', 400);
      }
    }

    // Get the next display order
    const { data: maxOrder } = await supabaseAdmin
      .from('custom_field_definitions')
      .select('display_order')
      .eq('company_id', companyId)
      .eq('entity_type', fieldData.entity_type)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = maxOrder ? maxOrder.display_order + 1 : 0;

    // Create the custom field
    const { data, error } = await supabaseAdmin
      .from('custom_field_definitions')
      .insert({
        company_id: companyId,
        field_name: fieldData.field_name,
        field_label: fieldData.field_label,
        field_description: fieldData.field_description,
        entity_type: fieldData.entity_type,
        data_type: fieldData.data_type,
        is_required: fieldData.is_required || false,
        is_unique: fieldData.is_unique || false,
        is_searchable: fieldData.is_searchable !== false, // Default true
        field_options: fieldData.field_options || [],
        validation_rules: fieldData.validation_rules || {},
        display_order: fieldData.display_order !== undefined ? fieldData.display_order : displayOrder,
        placeholder: fieldData.placeholder,
        help_text: fieldData.help_text,
        default_value: fieldData.default_value,
        is_active: fieldData.is_active !== false, // Default true
        is_system_field: false,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error creating custom field:', error);
    throw new ApiError('Failed to create custom field', 500);
  }
};

/**
 * Update a custom field definition
 */
const updateCustomField = async (companyId, fieldId, fieldData, userId) => {
  try {
    // Check if field exists and is not a system field
    const existing = await getCustomFieldById(companyId, fieldId);
    
    if (existing.is_system_field) {
      throw new ApiError('System fields cannot be modified', 403);
    }

    // If field_name is being changed, validate it
    if (fieldData.field_name && fieldData.field_name !== existing.field_name) {
      const fieldNameRegex = /^[a-z][a-z0-9_]*$/;
      if (!fieldNameRegex.test(fieldData.field_name)) {
        throw new ApiError(
          'Field name must start with a letter and contain only lowercase letters, numbers, and underscores',
          400
        );
      }

      // Check if new field name already exists
      const { data: duplicate } = await supabaseAdmin
        .from('custom_field_definitions')
        .select('id')
        .eq('company_id', companyId)
        .eq('entity_type', existing.entity_type)
        .eq('field_name', fieldData.field_name)
        .neq('id', fieldId)
        .single();

      if (duplicate) {
        throw new ApiError(
          `A custom field with name "${fieldData.field_name}" already exists for ${existing.entity_type}`,
          409
        );
      }
    }

    // Validate field options for select/multiselect
    const dataType = fieldData.data_type || existing.data_type;
    if (['select', 'multiselect'].includes(dataType)) {
      const options = fieldData.field_options !== undefined ? fieldData.field_options : existing.field_options;
      if (!options || !Array.isArray(options) || options.length === 0) {
        throw new ApiError('Field options are required for select/multiselect fields', 400);
      }
    }

    // Build update object (only include provided fields)
    const updateData = {
      ...fieldData,
      updated_by: userId
    };

    // Remove fields that shouldn't be updated
    delete updateData.company_id;
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.is_system_field;

    const { data, error } = await supabaseAdmin
      .from('custom_field_definitions')
      .update(updateData)
      .eq('id', fieldId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error updating custom field:', error);
    throw new ApiError('Failed to update custom field', 500);
  }
};

/**
 * Delete a custom field definition
 */
const deleteCustomField = async (companyId, fieldId, userId) => {
  try {
    console.log('🔴 [DELETE SERVICE] Starting delete for field:', fieldId, 'company:', companyId);
    
    // Check if field exists and is not a system field
    console.log('🔴 [DELETE SERVICE] Fetching field by ID...');
    const existing = await getCustomFieldById(companyId, fieldId);
    console.log('🔴 [DELETE SERVICE] Field found:', existing.field_name, 'is_system_field:', existing.is_system_field);
    
    if (existing.is_system_field) {
      console.log('❌ [DELETE SERVICE] Cannot delete system field');
      throw new ApiError('System fields cannot be deleted', 403);
    }

    // Check if field is being used
    console.log('🔴 [DELETE SERVICE] Checking field usage...');
    const usage = await getCustomFieldUsage(companyId, fieldId);
    console.log('🔴 [DELETE SERVICE] Usage count:', usage.usage_count);
    
    if (usage.usage_count > 0) {
      console.log('❌ [DELETE SERVICE] Field is in use, cannot delete');
      throw new ApiError(
        `This custom field is currently being used in ${usage.usage_count} ${existing.entity_type}(s). Please remove the field from all records before deleting it.`,
        409
      );
    }

    console.log('🔴 [DELETE SERVICE] Executing delete query...');
    const { error } = await supabaseAdmin
      .from('custom_field_definitions')
      .delete()
      .eq('id', fieldId)
      .eq('company_id', companyId);

    if (error) {
      console.log('❌ [DELETE SERVICE] Delete query error:', error);
      throw error;
    }

    console.log('✅ [DELETE SERVICE] Delete successful');
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('❌ [DELETE SERVICE] Unexpected error:', error);
    throw new ApiError('Failed to delete custom field', 500);
  }
};

/**
 * Reorder custom fields
 */
const reorderCustomFields = async (companyId, entityType, fieldOrders) => {
  try {
    // fieldOrders is an array of { id, display_order }
    const updates = fieldOrders.map(({ id, display_order }) => 
      supabaseAdmin
        .from('custom_field_definitions')
        .update({ display_order })
        .eq('id', id)
        .eq('company_id', companyId)
        .eq('entity_type', entityType)
    );

    await Promise.all(updates);

    return { success: true };
  } catch (error) {
    console.error('Error reordering custom fields:', error);
    throw new ApiError('Failed to reorder custom fields', 500);
  }
};

/**
 * Get custom field usage statistics
 */
const getCustomFieldUsage = async (companyId, fieldId) => {
  try {
    const field = await getCustomFieldById(companyId, fieldId);

    // Count usage based on entity type
    let usageCount = 0;
    let uniqueValuesCount = 0;
    let lastUsedAt = null;

    if (field.entity_type === 'lead') {
      const { count } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('custom_fields', 'is', null)
        .filter('custom_fields', 'cs', `{"${field.field_name}"`);

      usageCount = count || 0;

      // Get unique values and last used
      if (usageCount > 0) {
        const { data: leadsWithField } = await supabaseAdmin
          .from('leads')
          .select('custom_fields, created_at')
          .eq('company_id', companyId)
          .not('custom_fields', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (leadsWithField) {
          const values = new Set();
          leadsWithField.forEach(lead => {
            if (lead.custom_fields && lead.custom_fields[field.field_name]) {
              values.add(lead.custom_fields[field.field_name]);
              if (!lastUsedAt || new Date(lead.created_at) > new Date(lastUsedAt)) {
                lastUsedAt = lead.created_at;
              }
            }
          });
          uniqueValuesCount = values.size;
        }
      }
    }

    return {
      field_id: fieldId,
      field_name: field.field_name,
      field_label: field.field_label,
      entity_type: field.entity_type,
      usage_count: usageCount,
      unique_values_count: uniqueValuesCount,
      last_used_at: lastUsedAt
    };
  } catch (error) {
    console.error('Error getting custom field usage:', error);
    throw new ApiError('Failed to get custom field usage', 500);
  }
};

/**
 * Get all custom fields usage statistics for a company
 */
const getAllCustomFieldsUsage = async (companyId, entityType) => {
  try {
    const fields = await getCustomFields(companyId, { entity_type: entityType });
    
    const usagePromises = fields.map(field => 
      getCustomFieldUsage(companyId, field.id)
    );

    const usageStats = await Promise.all(usagePromises);
    
    return usageStats;
  } catch (error) {
    console.error('Error getting all custom fields usage:', error);
    throw new ApiError('Failed to get custom fields usage', 500);
  }
};

/**
 * Validate custom field value against field definition
 */
const validateCustomFieldValue = (fieldDefinition, value) => {
  const errors = [];

  // Check required
  if (fieldDefinition.is_required && (value === null || value === undefined || value === '')) {
    errors.push(`${fieldDefinition.field_label} is required`);
    return errors;
  }

  // If value is empty and not required, skip other validations
  if (value === null || value === undefined || value === '') {
    return errors;
  }

  // Validate by data type
  switch (fieldDefinition.data_type) {
    case 'number':
    case 'decimal':
    case 'currency':
      if (isNaN(value)) {
        errors.push(`${fieldDefinition.field_label} must be a number`);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${fieldDefinition.field_label} must be true or false`);
      }
      break;

    case 'date':
    case 'datetime':
      if (isNaN(Date.parse(value))) {
        errors.push(`${fieldDefinition.field_label} must be a valid date`);
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${fieldDefinition.field_label} must be a valid email`);
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        errors.push(`${fieldDefinition.field_label} must be a valid URL`);
      }
      break;

    case 'select':
      if (!fieldDefinition.field_options.includes(value)) {
        errors.push(`${fieldDefinition.field_label} must be one of: ${fieldDefinition.field_options.join(', ')}`);
      }
      break;

    case 'multiselect':
      if (!Array.isArray(value)) {
        errors.push(`${fieldDefinition.field_label} must be an array`);
      } else {
        const invalidOptions = value.filter(v => !fieldDefinition.field_options.includes(v));
        if (invalidOptions.length > 0) {
          errors.push(`${fieldDefinition.field_label} contains invalid options: ${invalidOptions.join(', ')}`);
        }
      }
      break;
  }

  // Apply validation rules
  if (fieldDefinition.validation_rules) {
    const rules = fieldDefinition.validation_rules;

    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldDefinition.field_label} must be at least ${rules.min}`);
    }

    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${fieldDefinition.field_label} must be at most ${rules.max}`);
    }

    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`${fieldDefinition.field_label} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`${fieldDefinition.field_label} must be at most ${rules.maxLength} characters`);
    }

    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        errors.push(`${fieldDefinition.field_label} format is invalid`);
      }
    }
  }

  return errors;
};

/**
 * Validate all custom fields for an entity
 */
const validateCustomFields = async (companyId, entityType, customFields) => {
  try {
    const fieldDefinitions = await getCustomFields(companyId, { 
      entity_type: entityType, 
      is_active: true 
    });

    const allErrors = [];

    // Validate each provided custom field
    for (const [fieldName, fieldValue] of Object.entries(customFields || {})) {
      const fieldDef = fieldDefinitions.find(def => def.field_name === fieldName);
      
      if (!fieldDef) {
        // Unknown field - you can choose to ignore or error
        continue;
      }

      const errors = validateCustomFieldValue(fieldDef, fieldValue);
      if (errors.length > 0) {
        allErrors.push(...errors);
      }
    }

    // Check for required fields that are missing
    const requiredFields = fieldDefinitions.filter(def => def.is_required);
    for (const fieldDef of requiredFields) {
      if (!customFields || !(fieldDef.field_name in customFields)) {
        allErrors.push(`${fieldDef.field_label} is required`);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  } catch (error) {
    console.error('Error validating custom fields:', error);
    throw new ApiError('Failed to validate custom fields', 500);
  }
};

module.exports = {
  getCustomFields,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
  getCustomFieldUsage,
  getAllCustomFieldsUsage,
  validateCustomFieldValue,
  validateCustomFields
};

