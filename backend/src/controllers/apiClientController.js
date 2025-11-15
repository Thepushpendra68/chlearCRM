const apiClientService = require('../services/apiClientService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * API Client Controller
 * Handles API client management operations
 * Extends BaseController for standardized patterns
 */
class ApiClientController extends BaseController {
  /**
   * Describe API client for logging
   */
  describeApiClient(client = {}) {
    return client?.client_name || `API Client ${client?.id || ''}`.trim();
  }

  /**
   * Create new API client
   */
  createApiClient = asyncHandler(async (req, res) => {
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
      return this.validationError(res, 'Client name is required');
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

    this.created(res, apiClient, 'API client created successfully. IMPORTANT: Save the API secret securely - it will not be shown again!');
  });

  /**
   * Get all API clients for company
   */
  getApiClients = asyncHandler(async (req, res) => {
    const apiClients = await apiClientService.getApiClients(req.user.company_id);

    this.success(res, apiClients, 200, 'API clients retrieved successfully');
  });

  /**
   * Get API client by ID
   */
  getApiClientById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const apiClient = await apiClientService.getApiClientById(id, req.user.company_id);

    if (!apiClient) {
      return this.notFound(res, 'API client not found');
    }

    this.success(res, apiClient, 200, 'API client retrieved successfully');
  });

  /**
   * Update API client
   */
  updateApiClient = asyncHandler(async (req, res) => {
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

    this.updated(res, apiClient, 'API client updated successfully');
  });

  /**
   * Regenerate API secret
   */
  regenerateSecret = asyncHandler(async (req, res) => {
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

    this.success(res, {
      api_key: apiClient.api_key,
      api_secret: apiClient.api_secret
    }, 200, 'API secret regenerated successfully. IMPORTANT: Save it securely - it will not be shown again!');
  });

  /**
   * Delete API client
   */
  deleteApiClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get client info before deletion for audit log
    const apiClient = await apiClientService.getApiClientById(id, req.user.company_id);

    if (!apiClient) {
      return this.notFound(res, 'API client not found');
    }

    await apiClientService.deleteApiClient(id, req.user.company_id);

    await logAuditEvent(req, {
      action: AuditActions.COMPANY_SETTINGS_UPDATED,
      resourceType: 'api_client',
      resourceId: id,
      resourceName: this.describeApiClient(apiClient),
      companyId: req.user.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        action: 'deleted'
      }
    });

    this.deleted(res, 'API client deleted successfully');
  });

  /**
   * Get API client statistics
   */
  getApiClientStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Verify the API client belongs to the user's company
    const apiClient = await apiClientService.getApiClientById(id, req.user.company_id);

    if (!apiClient) {
      return this.notFound(res, 'API client not found');
    }

    const stats = await apiClientService.getApiClientStats(id, parseInt(days));

    this.success(res, stats, 200, 'API client statistics retrieved successfully');
  });
}

module.exports = new ApiClientController();

