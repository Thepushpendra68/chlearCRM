const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a unique API key
 */
const generateApiKey = () => {
  return `ck_${crypto.randomBytes(24).toString('hex')}`;
};

/**
 * Generate a secure API secret
 */
const generateApiSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a new API client
 */
const createApiClient = async (companyId, clientData, createdBy) => {
  try {
    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();
    const apiSecretHash = await bcrypt.hash(apiSecret, 10);

    const { data: apiClient, error } = await supabaseAdmin
      .from('api_clients')
      .insert({
        company_id: companyId,
        client_name: clientData.client_name,
        api_key: apiKey,
        api_secret_hash: apiSecretHash,
        is_active: true,
        rate_limit: clientData.rate_limit || 100,
        allowed_origins: clientData.allowed_origins || [],
        webhook_url: clientData.webhook_url || null,
        custom_field_mapping: clientData.custom_field_mapping || {},
        default_lead_source: clientData.default_lead_source || 'api',
        default_assigned_to: clientData.default_assigned_to || null,
        metadata: clientData.metadata || {},
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Return the API secret ONLY on creation (never stored in plain text)
    return {
      ...apiClient,
      api_secret: apiSecret // Only returned once!
    };
  } catch (error) {
    console.error('Error creating API client:', error);
    throw new ApiError('Failed to create API client', 500);
  }
};

/**
 * Get all API clients for a company
 */
const getApiClients = async (companyId) => {
  try {
    const { data: apiClients, error } = await supabaseAdmin
      .from('api_clients')
      .select(`
        *,
        user_profiles!created_by(first_name, last_name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return apiClients;
  } catch (error) {
    console.error('Error fetching API clients:', error);
    throw new ApiError('Failed to fetch API clients', 500);
  }
};

/**
 * Get API client by ID
 */
const getApiClientById = async (id, companyId) => {
  try {
    const { data: apiClient, error } = await supabaseAdmin
      .from('api_clients')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error || !apiClient) {
      return null;
    }

    return apiClient;
  } catch (error) {
    console.error('Error fetching API client:', error);
    throw new ApiError('Failed to fetch API client', 500);
  }
};

/**
 * Update API client
 */
const updateApiClient = async (id, companyId, updateData) => {
  try {
    const updateFields = {
      updated_at: new Date().toISOString()
    };

    if (updateData.client_name !== undefined) updateFields.client_name = updateData.client_name;
    if (updateData.is_active !== undefined) updateFields.is_active = updateData.is_active;
    if (updateData.rate_limit !== undefined) updateFields.rate_limit = updateData.rate_limit;
    if (updateData.allowed_origins !== undefined) updateFields.allowed_origins = updateData.allowed_origins;
    if (updateData.webhook_url !== undefined) updateFields.webhook_url = updateData.webhook_url;
    if (updateData.custom_field_mapping !== undefined) updateFields.custom_field_mapping = updateData.custom_field_mapping;
    if (updateData.default_lead_source !== undefined) updateFields.default_lead_source = updateData.default_lead_source;
    if (updateData.default_assigned_to !== undefined) updateFields.default_assigned_to = updateData.default_assigned_to;
    if (updateData.metadata !== undefined) updateFields.metadata = updateData.metadata;

    const { data: apiClient, error } = await supabaseAdmin
      .from('api_clients')
      .update(updateFields)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return apiClient;
  } catch (error) {
    console.error('Error updating API client:', error);
    throw new ApiError('Failed to update API client', 500);
  }
};

/**
 * Regenerate API secret
 */
const regenerateApiSecret = async (id, companyId) => {
  try {
    const apiSecret = generateApiSecret();
    const apiSecretHash = await bcrypt.hash(apiSecret, 10);

    const { data: apiClient, error } = await supabaseAdmin
      .from('api_clients')
      .update({
        api_secret_hash: apiSecretHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...apiClient,
      api_secret: apiSecret // Only returned once!
    };
  } catch (error) {
    console.error('Error regenerating API secret:', error);
    throw new ApiError('Failed to regenerate API secret', 500);
  }
};

/**
 * Delete API client
 */
const deleteApiClient = async (id, companyId) => {
  try {
    const { error } = await supabaseAdmin
      .from('api_clients')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting API client:', error);
    throw new ApiError('Failed to delete API client', 500);
  }
};

/**
 * Get API client usage statistics
 */
const getApiClientStats = async (apiClientId, days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: requests, error } = await supabaseAdmin
      .from('api_client_requests')
      .select('*')
      .eq('api_client_id', apiClientId)
      .gte('created_at', startDate);

    if (error) {
      throw error;
    }

    const totalRequests = requests.length;
    const successfulRequests = requests.filter(r => r.status_code >= 200 && r.status_code < 300).length;
    const failedRequests = requests.filter(r => r.status_code >= 400).length;
    const averageResponseTime = requests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / totalRequests || 0;
    const leadsCreated = requests.filter(r => r.lead_id).length;

    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      leads_created: leadsCreated,
      average_response_time_ms: Math.round(averageResponseTime),
      last_request_at: requests[0]?.created_at || null
    };
  } catch (error) {
    console.error('Error fetching API client stats:', error);
    throw new ApiError('Failed to fetch API client statistics', 500);
  }
};

module.exports = {
  createApiClient,
  getApiClients,
  getApiClientById,
  updateApiClient,
  regenerateApiSecret,
  deleteApiClient,
  getApiClientStats
};

