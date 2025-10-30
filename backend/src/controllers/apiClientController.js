const apiClientService = require('../services/apiClientService');
const ApiError = require('../utils/ApiError');
const { AuditActions, logAuditEvent } = require('../utils/auditLogger');

/**
 * Create new API client
 */
const createApiClient = async (req, res, next) => {
  try {
    const { 
      client_name, 
      rate_limit, 
      allowed_origins, 
      webhook_url, 
      custom_field_mapping,
      default_lead_source,
      default_assigned_to,
      metadata 
    } = req.body;

    if (!client_name) {
      throw new ApiError('Client name is required', 400);
    }

    const apiClient = await apiClientService.createApiClient(
      req.user.company_id,
      {
        client_name,
        rate_limit,
        allowed_origins,
        webhook_url,
        custom_field_mapping,
        default_lead_source,
        default_assigned_to,
        metadata
      },
      req.user.id
    );

    await logAuditEvent(req, {
      action: AuditActions.COMPANY_SETTINGS_UPDATED,
      resourceType: 'api_client',
      resourceId: apiClient.id,
      resourceName: client_name,
      companyId: req.user.company_id,
      details: {
        action: 'created',
        api_key: apiClient.api_key
      }
    });

    res.status(201).json({
      success: true,
      message: 'API client created successfully. IMPORTANT: Save the API secret securely - it will not be shown again!',
      data: apiClient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all API clients for company
 */
const getApiClients = async (req, res, next) => {
  try {
    const apiClients = await apiClientService.getApiClients(req.user.company_id);

    res.json({
      success: true,
      data: apiClients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API client by ID
 */
const getApiClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apiClient = await apiClientService.getApiClientById(id, req.user.company_id);

    if (!apiClient) {
      throw new ApiError('API client not found', 404);
    }

    res.json({
      success: true,
      data: apiClient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update API client
 */
const updateApiClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const apiClient = await apiClientService.updateApiClient(id, req.user.company_id, updateData);

    await logAuditEvent(req, {
      action: AuditActions.COMPANY_SETTINGS_UPDATED,
      resourceType: 'api_client',
      resourceId: id,
      resourceName: apiClient.client_name,
      companyId: req.user.company_id,
      details: {
        action: 'updated',
        fields_updated: Object.keys(updateData)
      }
    });

    res.json({
      success: true,
      message: 'API client updated successfully',
      data: apiClient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate API secret
 */
const regenerateSecret = async (req, res, next) => {
  try {
    const { id } = req.params;

    const apiClient = await apiClientService.regenerateApiSecret(id, req.user.company_id);

    await logAuditEvent(req, {
      action: AuditActions.COMPANY_SETTINGS_UPDATED,
      resourceType: 'api_client',
      resourceId: id,
      resourceName: apiClient.client_name,
      companyId: req.user.company_id,
      details: {
        action: 'secret_regenerated'
      }
    });

    res.json({
      success: true,
      message: 'API secret regenerated successfully. IMPORTANT: Save it securely - it will not be shown again!',
      data: {
        api_key: apiClient.api_key,
        api_secret: apiClient.api_secret
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete API client
 */
const deleteApiClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get client info before deletion for audit log
    const apiClient = await apiClientService.getApiClientById(id, req.user.company_id);
    
    if (!apiClient) {
      throw new ApiError('API client not found', 404);
    }

    await apiClientService.deleteApiClient(id, req.user.company_id);

    await logAuditEvent(req, {
      action: AuditActions.COMPANY_SETTINGS_UPDATED,
      resourceType: 'api_client',
      resourceId: id,
      resourceName: apiClient.client_name,
      companyId: req.user.company_id,
      details: {
        action: 'deleted'
      }
    });

    res.json({
      success: true,
      message: 'API client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API client statistics
 */
const getApiClientStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Verify the API client belongs to the user's company
    const apiClient = await apiClientService.getApiClientById(id, req.user.company_id);
    
    if (!apiClient) {
      throw new ApiError('API client not found', 404);
    }

    const stats = await apiClientService.getApiClientStats(id, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApiClient,
  getApiClients,
  getApiClientById,
  updateApiClient,
  regenerateSecret,
  deleteApiClient,
  getApiClientStats
};

