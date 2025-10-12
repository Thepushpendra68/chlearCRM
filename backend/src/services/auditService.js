const { supabaseAdmin } = require('../config/supabase');

/**
 * Audit Service for Platform Administration
 * Logs all critical actions for compliance and security
 */
class AuditService {
  /**
   * Log an audit event
   * @param {Object} params - Audit event parameters
   */
  async logEvent({
    actorId,
    actorEmail,
    actorRole,
    action,
    resourceType,
    resourceId = null,
    details = {},
    metadata = {},
    ipAddress = null,
    userAgent = null,
    isImpersonation = false,
    impersonatedUserId = null,
    severity = 'info'
  }) {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_id: actorId,
          actor_email: actorEmail,
          actor_role: actorRole,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          metadata,
          ip_address: ipAddress,
          user_agent: userAgent,
          is_impersonation: isImpersonation,
          impersonated_user_id: impersonatedUserId,
          severity,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[AUDIT] Failed to log event:', error);
        // Don't throw - audit logging should not break the main flow
      }
    } catch (error) {
      console.error('[AUDIT] Exception while logging:', error);
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs({
    page = 1,
    limit = 50,
    actorId = null,
    action = null,
    resourceType = null,
    severity = null,
    startDate = null,
    endDate = null
  }) {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (actorId) query = query.eq('actor_id', actorId);
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (severity) query = query.eq('severity', severity);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit = 20) {
    const { data, error } = await supabaseAdmin
      .from('platform_recent_activity')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

module.exports = new AuditService();
