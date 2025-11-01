const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

/**
 * Middleware to authenticate API clients using API Key and Secret
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
      throw ApiError.unauthorized('API Key and Secret are required');
    }

    // Fetch API client from database
    const { data: apiClient, error } = await supabaseAdmin
      .from('api_clients')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !apiClient) {
      await logFailedRequest(null, req, 'Invalid API Key');
      throw ApiError.unauthorized('Invalid API credentials');
    }

    // Verify API secret
    const isValidSecret = await bcrypt.compare(apiSecret, apiClient.api_secret_hash);
    
    if (!isValidSecret) {
      await logFailedRequest(apiClient.id, req, 'Invalid API Secret');
      throw ApiError.unauthorized('Invalid API credentials');
    }

    // Check rate limiting
    const isRateLimited = await checkRateLimit(apiClient.id, apiClient.rate_limit);
    
    if (isRateLimited) {
      await logFailedRequest(apiClient.id, req, 'Rate limit exceeded');
      throw ApiError.tooManyRequests('Rate limit exceeded. Please try again later.');
    }

    // Update last used timestamp
    await supabaseAdmin
      .from('api_clients')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiClient.id);

    // Attach API client info to request
    req.apiClient = apiClient;
    req.isApiClient = true;
    req.apiRequestStartTime = Date.now();

    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    next(error);
  }
};

/**
 * Check if API client has exceeded rate limit
 */
const checkRateLimit = async (apiClientId, rateLimit) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('api_client_requests')
    .select('*', { count: 'exact', head: true })
    .eq('api_client_id', apiClientId)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return false;
  }

  return count >= rateLimit;
};

/**
 * Log API client request
 */
const logApiRequest = async (apiClientId, req, statusCode, responseTime, leadId = null, errorMessage = null) => {
  try {
    await supabaseAdmin
      .from('api_client_requests')
      .insert({
        api_client_id: apiClientId,
        endpoint: req.path,
        method: req.method,
        status_code: statusCode,
        response_time_ms: responseTime,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || null,
        user_agent: req.headers['user-agent'],
        request_body: req.body,
        lead_id: leadId,
        error_message: errorMessage
      });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
};

/**
 * Log failed API request
 */
const logFailedRequest = async (apiClientId, req, errorMessage) => {
  try {
    await supabaseAdmin
      .from('api_client_requests')
      .insert({
        api_client_id: apiClientId,
        endpoint: req.path,
        method: req.method,
        status_code: 401,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || null,
        user_agent: req.headers['user-agent'],
        error_message: errorMessage
      });
  } catch (error) {
    console.error('Failed to log failed request:', error);
  }
};

module.exports = {
  authenticateApiKey,
  logApiRequest
};

