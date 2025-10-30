const customFieldService = require('../services/customFieldService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Custom Field Controller
 * Handles custom field management operations
 * Extends BaseController for standardized patterns
 */
class CustomFieldController extends BaseController {
  /**
   * Describe custom field for logging
   */
  describeCustomField(field = {}) {
    return field?.field_label || `Custom Field ${field?.id || ''}`.trim();
  }

  /**
   * Get all custom fields for the company
   * @route GET /api/custom-fields
   */
  getCustomFields = asyncHandler(async (req, res) => {
    const { entity_type, is_active, data_type, search } = req.query;

    const filters = {};
    if (entity_type) filters.entity_type = entity_type;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (data_type) filters.data_type = data_type;
    if (search) filters.search = search;

    const customFields = await customFieldService.getCustomFields(req.user.company_id, filters);

    this.success(res, customFields, 200, 'Custom fields retrieved successfully');
  });

  /**
   * Get a single custom field by ID
   * @route GET /api/custom-fields/:id
   */
  getCustomFieldById = asyncHandler(async (req, res) => {
    const customField = await customFieldService.getCustomFieldById(
      req.user.company_id,
      req.params.id
    );

    if (!customField) {
      return this.notFound(res, 'Custom field not found');
    }

<<<<<<< HEAD
    this.success(res, customField, 200, 'Custom field retrieved successfully');
  });

  /**
   * Create a new custom field
   * @route POST /api/custom-fields
   */
  createCustomField = asyncHandler(async (req, res) => {
=======
/**
 * Create a new custom field
 * @route POST /api/custom-fields
 */
const createCustomField = async (req, res, next) => {
  try {
    console.log('🔵 [CREATE CUSTOM FIELD] Request received');
    console.log('🔵 [CREATE CUSTOM FIELD] Body:', JSON.stringify(req.body, null, 2));
    console.log('🔵 [CREATE CUSTOM FIELD] User:', req.user.id, req.user.role);
    
>>>>>>> fb56af8 (FEATURE: Add public lead capture form with API integration and custom fields)
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
<<<<<<< HEAD
      return this.validationError(res, 'Field name is required');
    }

    if (!field_label) {
      return this.validationError(res, 'Field label is required');
    }

    if (!entity_type) {
      return this.validationError(res, 'Entity type is required');
    }

    if (!data_type) {
      return this.validationError(res, 'Data type is required');
=======
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
>>>>>>> fb56af8 (FEATURE: Add public lead capture form with API integration and custom fields)
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

    this.created(res, customField, 'Custom field created successfully');
  });

  /**
   * Update a custom field
   * @route PUT /api/custom-fields/:id
   */
  updateCustomField = asyncHandler(async (req, res) => {
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

    this.updated(res, customField, 'Custom field updated successfully');
  });

<<<<<<< HEAD
  /**
   * Delete a custom field
   * @route DELETE /api/custom-fields/:id
   */
  deleteCustomField = asyncHandler(async (req, res) => {
=======
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
    
>>>>>>> fb56af8 (FEATURE: Add public lead capture form with API integration and custom fields)
    // Get field info before deletion for audit log
    console.log('🔴 [DELETE CUSTOM FIELD] Fetching field info...');
    const field = await customFieldService.getCustomFieldById(
      req.user.company_id,
      req.params.id
    );
    console.log('🔴 [DELETE CUSTOM FIELD] Field found:', field.field_name);

<<<<<<< HEAD
    if (!field) {
      return this.notFound(res, 'Custom field not found');
    }

=======
    console.log('🔴 [DELETE CUSTOM FIELD] Calling delete service...');
>>>>>>> fb56af8 (FEATURE: Add public lead capture form with API integration and custom fields)
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
      resourceName: this.describeCustomField(field),
      companyId: req.user.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        field_name: field.field_name,
        entity_type: field.entity_type
      }
    });

    this.deleted(res, 'Custom field deleted successfully');
  });

  /**
   * Reorder custom fields
   * @route POST /api/custom-fields/reorder
   */
  reorderCustomFields = asyncHandler(async (req, res) => {
    const { entity_type, field_orders } = req.body;

    if (!entity_type) {
      return this.validationError(res, 'Entity type is required');
    }

    if (!Array.isArray(field_orders)) {
      return this.validationError(res, 'Field orders must be an array');
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

    this.success(res, { message: 'Custom fields reordered successfully' }, 200, 'Custom fields reordered successfully');
  });

  /**
   * Get custom field usage statistics
   * @route GET /api/custom-fields/:id/usage
   */
  getCustomFieldUsage = asyncHandler(async (req, res) => {
    const usage = await customFieldService.getCustomFieldUsage(
      req.user.company_id,
      req.params.id
    );

    this.success(res, usage, 200, 'Custom field usage retrieved successfully');
  });

  /**
   * Get all custom fields usage statistics
   * @route GET /api/custom-fields/usage/all
   */
  getAllCustomFieldsUsage = asyncHandler(async (req, res) => {
    const { entity_type } = req.query;

    if (!entity_type) {
      return this.validationError(res, 'Entity type is required');
    }

    const usageStats = await customFieldService.getAllCustomFieldsUsage(
      req.user.company_id,
      entity_type
    );

    this.success(res, usageStats, 200, 'Custom fields usage statistics retrieved successfully');
  });

  /**
   * Validate custom fields
   * @route POST /api/custom-fields/validate
   */
  validateCustomFields = asyncHandler(async (req, res) => {
    const { entity_type, custom_fields } = req.body;

    if (!entity_type) {
      return this.validationError(res, 'Entity type is required');
    }

    const validation = await customFieldService.validateCustomFields(
      req.user.company_id,
      entity_type,
      custom_fields
    );

    this.success(res, validation, 200, 'Custom fields validation completed');
  });
}

module.exports = new CustomFieldController();

