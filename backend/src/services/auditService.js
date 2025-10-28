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
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const logs = data || [];
    const companyIds = new Set();
    const userIds = new Set();

    logs.forEach((log) => {
      const details = log?.details || {};

      if (log?.resource_type === 'company' && log?.resource_id) {
        companyIds.add(log.resource_id);
      }
      if (details.company_id) {
        companyIds.add(details.company_id);
      }
      if (details.target_company_id) {
        companyIds.add(details.target_company_id);
      }

      if (log?.resource_type === 'user' && log?.resource_id) {
        userIds.add(log.resource_id);
      }
      if (details.user_id) {
        userIds.add(details.user_id);
      }
      if (details.target_user_id) {
        userIds.add(details.target_user_id);
      }
      if (log?.actor_id) {
        userIds.add(log.actor_id);
      }
    });

    let companyLookup = {};
    if (companyIds.size > 0) {
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name, company_slug')
        .in('id', Array.from(companyIds));

      if (companyError) {
        console.error('[AUDIT] Failed to fetch company names:', companyError);
      } else if (Array.isArray(companyData)) {
        companyLookup = companyData.reduce((acc, company) => {
          acc[company.id] = company;
          return acc;
        }, {});
      }
    }

    let userLookup = {};
    if (userIds.size > 0) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, company_id')
        .in('id', Array.from(userIds));

      if (userError) {
        console.error('[AUDIT] Failed to fetch user profiles:', userError);
      } else if (Array.isArray(userData)) {
        userLookup = userData.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }
    }

    const ACTION_LABELS = {
      platform_create_user: 'Created platform user',
      view_platform_stats: 'Viewed platform analytics',
      view_all_companies: 'Viewed all companies',
      view_company_details: 'Viewed company details',
      search_platform_users: 'Searched platform users',
      start_impersonation: 'Started impersonation',
      impersonate_user: 'Impersonated user',
      update_company_status: 'Updated company status'
    };

    const getCompanyName = (companyId, fallback = null) => {
      if (!companyId) return fallback;
      return companyLookup[companyId]?.name || fallback;
    };

    const getCompanySlug = (companyId, fallback = null) => {
      if (!companyId) return fallback;
      return companyLookup[companyId]?.company_slug || fallback;
    };

    const getUserDisplay = (userId, fallback = null) => {
      if (!userId) return fallback;
      const profile = userLookup[userId];
      if (!profile) return fallback;
      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      return name || fallback;
    };

    const deriveResourceName = (log) => {
      const details = log?.details || {};

      if (log?.resource_type === 'company' || details.company_id || details.target_company_id) {
        const companyId = details.company_id || details.target_company_id || log?.resource_id;
        const companyName = getCompanyName(companyId, details.company_name);
        if (companyName) {
          return companyName;
        }
        const companySlug = getCompanySlug(companyId, details.company_slug);
        if (companySlug) {
          return companySlug;
        }
      }

      switch (log?.action) {
        case 'platform_create_user': {
          const companyId = details.company_id || log?.resource_id;
          const companyName = getCompanyName(companyId);
          if (details.email && companyName) {
            return `Created ${details.email} (${companyName})`;
          }
          if (details.email) {
            return `Created ${details.email}`;
          }
          if (companyName) {
            return `Created new user for ${companyName}`;
          }
          return 'Created a new user';
        }
        case 'view_company_details': {
          const companyId = details.company_id || log?.resource_id;
          const companyName = getCompanyName(companyId, details.company_name);
          if (companyName) {
            return `Viewed ${companyName}`;
          }
          const companySlug = details.company_slug || getCompanySlug(companyId);
          if (companySlug) {
            return `Viewed ${companySlug}`;
          }
          return companyId ? `Viewed company ${companyId}` : 'Viewed company details';
        }
        case 'update_company_status': {
          const companyId = details.company_id || log?.resource_id;
          const companyName = getCompanyName(companyId, details.company_name);
          if (companyName && details.status) {
            return `Set ${companyName} to ${details.status}`;
          }
          if (details.status && companyId) {
            return `Set company ${companyId} to ${details.status}`;
          }
          if (details.status) {
            return `Updated company status to ${details.status}`;
          }
          return 'Updated company status';
        }
        case 'search_platform_users': {
          const searchTerm = details.search ? `"${details.search}"` : 'users';
          const companyId = details.company_id || log?.resource_id;
          const companyName = getCompanyName(companyId);
          if (companyName) {
            return `Searched ${searchTerm} in ${companyName}`;
          }
          return `Searched ${searchTerm}`;
        }
        case 'start_impersonation': {
          const targetUserId = details.target_user_id || log?.resource_id;
          const targetEmail = details.target_user_email || details.email;
          const targetDisplay = getUserDisplay(targetUserId, targetEmail);
          const companyName = getCompanyName(details.target_company_id);
          if (targetDisplay && companyName) {
            return `Started impersonating ${targetDisplay} (${companyName})`;
          }
          if (targetDisplay) {
            return `Started impersonating ${targetDisplay}`;
          }
          return 'Started impersonation session';
        }
        case 'impersonate_user': {
          const targetUserId = details.target_user_id || log?.resource_id;
          const targetEmail = details.target_user_email || details.email;
          const targetDisplay = getUserDisplay(targetUserId, targetEmail);
          const companyName = getCompanyName(details.target_company_id);
          if (targetDisplay && companyName) {
            return `Impersonated ${targetDisplay} (${companyName})`;
          }
          if (targetDisplay) {
            return `Impersonated ${targetDisplay}`;
          }
          return 'Impersonated a user';
        }
        case 'view_all_companies':
          return 'Viewed companies list';
        case 'view_platform_stats':
          return 'Viewed platform analytics';
        default: {
          if (log?.resource_type === 'user') {
            const userDisplay = getUserDisplay(
              log?.resource_id,
              details.email || details.target_user_email
            );
            if (userDisplay) {
              return `${ACTION_LABELS[log?.action] || 'User activity'} (${userDisplay})`;
            }
          }
          return ACTION_LABELS[log?.action] || 'Platform activity';
        }
      }
    };

    return logs.map((log) => {
      const actorProfile = userLookup[log?.actor_id];
      const actorName = actorProfile
        ? `${actorProfile.first_name || ''} ${actorProfile.last_name || ''}`.trim()
        : null;
      const actorCompanyName = actorProfile ? getCompanyName(actorProfile.company_id) : null;

      return {
        ...log,
        activity_type: log.action,
        activity_label:
          ACTION_LABELS[log.action] ||
          (log.action ? log.action.replace(/_/g, ' ') : 'Platform activity'),
        resource_name: deriveResourceName(log),
        actor_name: actorName || null,
        actor_company_name: actorCompanyName || null,
        timestamp: log.created_at
      };
    });
  }
}

module.exports = new AuditService();
