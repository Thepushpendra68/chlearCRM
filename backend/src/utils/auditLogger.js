const auditService = require('../services/auditService');

const AuditSeverity = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

const AuditActions = Object.freeze({
  // Authentication
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_FAILURE: 'auth_login_failure',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_PASSWORD_CHANGE: 'auth_password_change',
  AUTH_PASSWORD_RESET_REQUEST: 'auth_password_reset_request',
  AUTH_PASSWORD_RESET: 'auth_password_reset',
  AUTH_REGISTER_SUCCESS: 'auth_register_success',
  AUTH_REGISTER_FAILURE: 'auth_register_failure',

  // User & company management
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_STATUS_CHANGED: 'user_status_changed',
  COMPANY_SETTINGS_UPDATED: 'company_settings_updated',

  // Lead lifecycle
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_DELETED: 'lead_deleted',
  LEAD_STATUS_CHANGED: 'lead_status_changed',
  LEAD_OWNER_CHANGED: 'lead_owner_changed',
  LEAD_NOTE_ADDED: 'lead_note_added',

  // Pipeline & activities
  PIPELINE_STAGE_CREATED: 'pipeline_stage_created',
  PIPELINE_STAGE_UPDATED: 'pipeline_stage_updated',
  PIPELINE_STAGE_DELETED: 'pipeline_stage_deleted',
  PIPELINE_AUTOMATION_UPDATED: 'pipeline_automation_updated',
  PIPELINE_STAGE_REORDERED: 'pipeline_stage_reordered',
  PIPELINE_LEAD_MOVED: 'pipeline_lead_moved',
  ACTIVITY_LOGGED: 'activity_logged',
  ACTIVITY_UPDATED: 'activity_updated',
  ACTIVITY_DELETED: 'activity_deleted',

  // Tasks & assignments
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_DELETED: 'task_deleted',
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_UPDATED: 'assignment_updated',
  ASSIGNMENT_DELETED: 'assignment_deleted',
 
  // Imports / exports
  IMPORT_STARTED: 'import_started',
  IMPORT_COMPLETED: 'import_completed',
  IMPORT_FAILED: 'import_failed',
  EXPORT_GENERATED: 'export_generated',
  IMPORT_TEMPLATE_DOWNLOADED: 'import_template_downloaded',
  IMPORT_FILE_VALIDATED: 'import_file_validated',
  IMPORT_HEADERS_DETECTED: 'import_headers_detected',

  // Reports
  REPORT_GENERATED: 'report_generated',
  REPORT_EXPORTED: 'report_exported',
  REPORT_SCHEDULED: 'report_scheduled',
  REPORT_SCHEDULE_UPDATED: 'report_schedule_updated',

  // Preferences / settings
  USER_PREFERENCES_UPDATED: 'user_preferences_updated',
  USER_PREFERENCES_RESET: 'user_preferences_reset',
  COMPANY_SETTINGS_UPDATED: 'company_settings_updated',

  // Custom fields
  CUSTOM_FIELD_CREATED: 'custom_field_created',
  CUSTOM_FIELD_UPDATED: 'custom_field_updated',
  CUSTOM_FIELD_DELETED: 'custom_field_deleted',
  CUSTOM_FIELD_REORDERED: 'custom_field_reordered',

  // Platform existing actions (for consistency)
  PLATFORM_CREATE_USER: 'platform_create_user',
  PLATFORM_VIEW_COMPANIES: 'view_all_companies',
  PLATFORM_VIEW_STATS: 'view_platform_stats',
  PLATFORM_VIEW_COMPANY: 'view_company_details',
  PLATFORM_UPDATE_COMPANY_STATUS: 'update_company_status',
  PLATFORM_SEARCH_USERS: 'search_platform_users',
  PLATFORM_IMPERSONATE_START: 'start_impersonation',
  PLATFORM_IMPERSONATE_SWITCH: 'impersonate_user',
  PLATFORM_IMPERSONATE_END: 'end_impersonation',
  IMPORT_TELEMETRY_VIEWED: 'import_telemetry_viewed'
});

const removeUndefined = (obj = {}) =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});

const resolveActorContext = (req = {}, overrides = {}) => {
  const actorSource = overrides.actor || req.originalUser || req.user || {};

  return {
    actorId: overrides.actorId ?? actorSource.id ?? null,
    actorEmail: overrides.actorEmail ?? actorSource.email ?? null,
    actorRole: overrides.actorRole ?? actorSource.role ?? null,
    ipAddress: overrides.ipAddress ?? req.ip ?? null,
    userAgent: overrides.userAgent ?? (req.headers ? req.headers['user-agent'] : null) ?? null,
    isImpersonation:
      overrides.isImpersonation ??
      Boolean(req.originalUser) ??
      Boolean(actorSource.isImpersonated),
    impersonatedUserId:
      overrides.impersonatedUserId ??
      (req.originalUser ? req.user?.id : actorSource.impersonated_user_id) ??
      null
  };
};

async function logAuditEvent(req, {
  action,
  resourceType,
  resourceId = null,
  resourceName = null,
  companyId = null,
  severity = AuditSeverity.INFO,
  details = {},
  metadata = {},
  actor = undefined,
  actorId = undefined,
  actorEmail = undefined,
  actorRole = undefined,
  ipAddress = undefined,
  userAgent = undefined,
  isImpersonation = undefined,
  impersonatedUserId = undefined
}) {
  if (!action) {
    throw new Error('logAuditEvent requires an action');
  }

  const actorContext = resolveActorContext(req, {
    actor,
    actorId,
    actorEmail,
    actorRole,
    ipAddress,
    userAgent,
    isImpersonation,
    impersonatedUserId
  });
  const detailPayload = removeUndefined({
    ...details,
    resource_name: resourceName,
    company_id: companyId ?? details.company_id,
    impersonated_user_id: actorContext.isImpersonation
      ? actorContext.impersonatedUserId
      : details.impersonated_user_id
  });

  return auditService.logEvent({
    actorId: actorContext.actorId,
    actorEmail: actorContext.actorEmail,
    actorRole: actorContext.actorRole,
    action,
    resourceType,
    resourceId,
    details: detailPayload,
    metadata,
    severity,
    isImpersonation: actorContext.isImpersonation,
    impersonatedUserId: actorContext.impersonatedUserId,
    ipAddress: actorContext.ipAddress,
    userAgent: actorContext.userAgent
  });
}

module.exports = {
  AuditActions,
  AuditSeverity,
  logAuditEvent
};
