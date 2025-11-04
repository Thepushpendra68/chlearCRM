const leadService = require('../services/leadService');
const customFieldService = require('../services/customFieldService');
const ApiError = require('../utils/ApiError');
const { logApiRequest } = require('../middleware/apiKeyMiddleware');
const { AuditActions, logAuditEvent } = require('../utils/auditLogger');

/**
 * Public endpoint for external lead capture
 * @route POST /api/v1/capture/lead
 * @access API Key authentication required
 */
const captureLead = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      job_title,
      lead_source,
      notes,
      custom_fields
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name) {
      throw new ApiError('First name and last name are required', 400);
    }

    if (!email && !phone) {
      throw new ApiError('At least one contact method (email or phone) is required', 400);
    }

    // Apply custom field mapping if configured
    let mappedCustomFields = custom_fields || {};
    if (req.apiClient.custom_field_mapping && Object.keys(req.apiClient.custom_field_mapping).length > 0) {
      mappedCustomFields = applyFieldMapping(custom_fields || {}, req.apiClient.custom_field_mapping);
    }

    // Validate custom fields against definitions (if any exist)
    if (mappedCustomFields && Object.keys(mappedCustomFields).length > 0) {
      try {
        const validation = await customFieldService.validateCustomFields(
          req.apiClient.company_id,
          'lead',
          mappedCustomFields
        );
        
        if (!validation.valid) {
          throw new ApiError(`Custom field validation failed: ${validation.errors.join(', ')}`, 400);
        }
      } catch (error) {
        // If validation service fails, log but don't block (backward compatibility)
        console.warn('Custom field validation error:', error.message);
        // Only throw if it's a validation error, not a system error
        if (error instanceof ApiError) {
          throw error;
        }
      }
    }

    // Create lead data
    const leadData = {
      company_id: req.apiClient.company_id,
      first_name,
      last_name,
      email,
      phone,
      company,
      job_title,
      lead_source: lead_source || req.apiClient.default_lead_source || 'api',
      status: 'new',
      notes: notes || `Lead captured via API from ${req.apiClient.client_name}`,
      priority: 'medium',
      custom_fields: mappedCustomFields,
      created_by: null, // API-generated leads don't have a user creator
      assigned_to: req.apiClient.default_assigned_to || null // Use default or auto-assignment
    };

    // Create the lead
    const lead = await leadService.createLead(leadData);

    // Log successful request
    const responseTime = Date.now() - startTime;
    await logApiRequest(req.apiClient.id, req, 201, responseTime, lead.id);

    // Log audit event
    await logAuditEvent(req, {
      action: AuditActions.LEAD_CREATED,
      resourceType: 'lead',
      resourceId: lead.id,
      resourceName: `${lead.first_name} ${lead.last_name}`,
      companyId: lead.company_id,
      actor: {
        id: req.apiClient.id,
        type: 'api_client',
        name: req.apiClient.client_name
      },
      details: {
        source: 'api_capture',
        api_client: req.apiClient.client_name,
        has_custom_fields: Object.keys(mappedCustomFields).length > 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      data: {
        lead_id: lead.id,
        status: lead.status
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      req.apiClient.id,
      req,
      error.statusCode || 500,
      responseTime,
      null,
      error.message
    );
    
    next(error);
  }
};

/**
 * Bulk lead capture endpoint
 * @route POST /api/v1/capture/leads/bulk
 * @access API Key authentication required
 */
const captureBulkLeads = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      throw new ApiError('Leads array is required and must not be empty', 400);
    }

    if (leads.length > 100) {
      throw new ApiError('Maximum 100 leads can be submitted at once', 400);
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const leadData of leads) {
      try {
        // Validate required fields
        if (!leadData.first_name || !leadData.last_name) {
          throw new Error('First name and last name are required');
        }

        if (!leadData.email && !leadData.phone) {
          throw new Error('At least one contact method is required');
        }

        // Apply custom field mapping
        let mappedCustomFields = leadData.custom_fields || {};
        if (req.apiClient.custom_field_mapping && Object.keys(req.apiClient.custom_field_mapping).length > 0) {
          mappedCustomFields = applyFieldMapping(leadData.custom_fields || {}, req.apiClient.custom_field_mapping);
        }

        const lead = await leadService.createLead({
          company_id: req.apiClient.company_id,
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          job_title: leadData.job_title,
          lead_source: leadData.lead_source || req.apiClient.default_lead_source || 'api',
          status: 'new',
          notes: leadData.notes || `Lead captured via API from ${req.apiClient.client_name}`,
          priority: 'medium',
          custom_fields: mappedCustomFields,
          created_by: null,
          assigned_to: req.apiClient.default_assigned_to || null
        });

        results.successful.push({
          lead_id: lead.id,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name
        });
      } catch (error) {
        results.failed.push({
          email: leadData.email,
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          error: error.message
        });
      }
    }

    const responseTime = Date.now() - startTime;
    await logApiRequest(req.apiClient.id, req, 200, responseTime);

    res.json({
      success: true,
      message: `Bulk capture completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      req.apiClient.id,
      req,
      error.statusCode || 500,
      responseTime,
      null,
      error.message
    );
    
    next(error);
  }
};

/**
 * Get API client info (for testing/debugging)
 * @route GET /api/v1/capture/info
 * @access API Key authentication required
 */
const getApiInfo = async (req, res) => {
  res.json({
    success: true,
    data: {
      client_name: req.apiClient.client_name,
      rate_limit: req.apiClient.rate_limit,
      default_lead_source: req.apiClient.default_lead_source,
      has_custom_field_mapping: Object.keys(req.apiClient.custom_field_mapping || {}).length > 0,
      allowed_origins: req.apiClient.allowed_origins
    }
  });
};

/**
 * Helper function to apply custom field mapping
 */
const applyFieldMapping = (customFields, mapping) => {
  const mapped = {};
  
  for (const [sourceField, targetField] of Object.entries(mapping)) {
    if (customFields[sourceField] !== undefined) {
      mapped[targetField] = customFields[sourceField];
    }
  }
  
  // Include unmapped fields as-is
  for (const [field, value] of Object.entries(customFields)) {
    if (!mapping[field]) {
      mapped[field] = value;
    }
  }
  
  return mapped;
};

module.exports = {
  captureLead,
  captureBulkLeads,
  getApiInfo
};

