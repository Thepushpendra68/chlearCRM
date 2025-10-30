const customFieldService = require('../services/customFieldService');
const ApiError = require('../utils/ApiError');
const { AuditActions, logAuditEvent } = require('../utils/auditLogger');

/**
 * Get all custom fields for the company
 * @route GET /api/custom-fields
 */
const getCustomFields = async (req, res, next) => {
  try {
    const { entity_type, is_active, data_type, search } = req.query;

    const filters = {};
    if (entity_type) filters.entity_type = entity_type;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (data_type) filters.data_type = data_type;
    if (search) filters.search = search;

    const customFields = await customFieldService.getCustomFields(req.user.company_id, filters);

    res.json({
      success: true,
      data: customFields
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single custom field by ID
 * @route GET /api/custom-fields/:id
 */
const getCustomFieldById = async (req, res, next) => {
  try {
    const customField = await customFieldService.getCustomFieldById(
      req.user.company_id,
      req.params.id
    );

    res.json({
      success: true,
      data: customField
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new custom field
 * @route POST /api/custom-fields
 */
const createCustomField = async (req, res, next) => {
  try {
    console.log('🔵 [CREATE CUSTOM FIELD] Request received');
    console.log('🔵 [CREATE CUSTOM FIELD] Body:', JSON.stringify(req.body, null, 2));
    console.log('🔵 [CREATE CUSTOM FIELD] User:', req.user.id, req.user.role);
    
    const {
      field_name,
      field_label,
      field_description,
      entity_type,
      data_type,
      is_required,
      is_unique,
      is_searchable,
      field_options,
      validation_rules,
      display_order,
      placeholder,
      help_text,
      default_value,
      is_active
    } = req.body;

    // Validate required fields
    if (!field_name) {
      console.log('❌ [CREATE CUSTOM FIELD] Validation failed: field_name missing');
      throw new ApiError('Field name is required', 400);
    }

    if (!field_label) {
      console.log('❌ [CREATE CUSTOM FIELD] Validation failed: field_label missing');
      throw new ApiError('Field label is required', 400);
    }

    if (!entity_type) {
      console.log('❌ [CREATE CUSTOM FIELD] Validation failed: entity_type missing');
      throw new ApiError('Entity type is required', 400);
    }

    if (!data_type) {
      console.log('❌ [CREATE CUSTOM FIELD] Validation failed: data_type missing');
      throw new ApiError('Data type is required', 400);
    }

    console.log('✅ [CREATE CUSTOM FIELD] Validation passed, calling service...');
    
    const customField = await customFieldService.createCustomField(
      req.user.company_id,
      {
        field_name,
        field_label,
        field_description,
        entity_type,
        data_type,
        is_required,
        is_unique,
        is_searchable,
        field_options,
        validation_rules,
        display_order,
        placeholder,
        help_text,
        default_value,
        is_active
      },
      req.user.id
    );
    
    console.log('✅ [CREATE CUSTOM FIELD] Service completed successfully');

    // Log audit event
    await logAuditEvent(req, {
      action: AuditActions.CUSTOM_FIELD_CREATED,
      resourceType: 'custom_field',
      resourceId: customField.id,
      resourceName: field_label,
      companyId: req.user.company_id,
      details: {
        entity_type,
        data_type,
        field_name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      data: customField
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a custom field
 * @route PUT /api/custom-fields/:id
 */
const updateCustomField = async (req, res, next) => {
  try {
    const customField = await customFieldService.updateCustomField(
      req.user.company_id,
      req.params.id,
      req.body,
      req.user.id
    );

    // Log audit event
    await logAuditEvent(req, {
      action: AuditActions.CUSTOM_FIELD_UPDATED,
      resourceType: 'custom_field',
      resourceId: customField.id,
      resourceName: customField.field_label,
      companyId: req.user.company_id,
      details: {
        changes: req.body
      }
    });

    res.json({
      success: true,
      message: 'Custom field updated successfully',
      data: customField
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a custom field
 * @route DELETE /api/custom-fields/:id
 */
const deleteCustomField = async (req, res, next) => {
  try {
    console.log('🔴 [DELETE CUSTOM FIELD] Request received');
    console.log('🔴 [DELETE CUSTOM FIELD] Field ID:', req.params.id);
    console.log('🔴 [DELETE CUSTOM FIELD] User:', req.user.id, req.user.role);
    console.log('🔴 [DELETE CUSTOM FIELD] Company:', req.user.company_id);
    
    // Get field info before deletion for audit log
    console.log('🔴 [DELETE CUSTOM FIELD] Fetching field info...');
    const field = await customFieldService.getCustomFieldById(
      req.user.company_id,
      req.params.id
    );
    console.log('🔴 [DELETE CUSTOM FIELD] Field found:', field.field_name);

    console.log('🔴 [DELETE CUSTOM FIELD] Calling delete service...');
    await customFieldService.deleteCustomField(
      req.user.company_id,
      req.params.id,
      req.user.id
    );
    console.log('✅ [DELETE CUSTOM FIELD] Delete service completed');

    // Log audit event
    await logAuditEvent(req, {
      action: AuditActions.CUSTOM_FIELD_DELETED,
      resourceType: 'custom_field',
      resourceId: req.params.id,
      resourceName: field.field_label,
      companyId: req.user.company_id,
      details: {
        field_name: field.field_name,
        entity_type: field.entity_type
      }
    });

    res.json({
      success: true,
      message: 'Custom field deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder custom fields
 * @route POST /api/custom-fields/reorder
 */
const reorderCustomFields = async (req, res, next) => {
  try {
    const { entity_type, field_orders } = req.body;

    if (!entity_type) {
      throw new ApiError('Entity type is required', 400);
    }

    if (!Array.isArray(field_orders)) {
      throw new ApiError('Field orders must be an array', 400);
    }

    await customFieldService.reorderCustomFields(
      req.user.company_id,
      entity_type,
      field_orders
    );

    // Log audit event
    await logAuditEvent(req, {
      action: AuditActions.CUSTOM_FIELD_REORDERED,
      resourceType: 'custom_field',
      resourceId: null,
      resourceName: 'Field Order',
      companyId: req.user.company_id,
      details: {
        entity_type,
        count: field_orders.length
      }
    });

    res.json({
      success: true,
      message: 'Custom fields reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get custom field usage statistics
 * @route GET /api/custom-fields/:id/usage
 */
const getCustomFieldUsage = async (req, res, next) => {
  try {
    const usage = await customFieldService.getCustomFieldUsage(
      req.user.company_id,
      req.params.id
    );

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all custom fields usage statistics
 * @route GET /api/custom-fields/usage/all
 */
const getAllCustomFieldsUsage = async (req, res, next) => {
  try {
    const { entity_type } = req.query;

    if (!entity_type) {
      throw new ApiError('Entity type is required', 400);
    }

    const usageStats = await customFieldService.getAllCustomFieldsUsage(
      req.user.company_id,
      entity_type
    );

    res.json({
      success: true,
      data: usageStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate custom fields
 * @route POST /api/custom-fields/validate
 */
const validateCustomFields = async (req, res, next) => {
  try {
    const { entity_type, custom_fields } = req.body;

    if (!entity_type) {
      throw new ApiError('Entity type is required', 400);
    }

    const validation = await customFieldService.validateCustomFields(
      req.user.company_id,
      entity_type,
      custom_fields
    );

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    next(error);
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
  validateCustomFields
};

