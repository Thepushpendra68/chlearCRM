## Audit Logging Overview

This project now emits structured audit events for every high‑risk platform action. The logging helper lives at `backend/src/utils/auditLogger.js` and wraps `auditService.logEvent`, automatically capturing:

- Actor id/email/role (with impersonation awareness)
- Resource type/id/name
- Company id
- Request IP and user agent
- Severity (info/warning/critical)
- Action-specific metadata (`details`, `metadata`)

### Action Taxonomy

| Domain | Action constants (subset) | Triggered by |
| --- | --- | --- |
| Authentication | `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_LOGOUT`, `AUTH_PASSWORD_CHANGE`, registration events | `authController` |
| Platform admin | `PLATFORM_CREATE_USER`, `PLATFORM_VIEW_*`, `PLATFORM_UPDATE_COMPANY_STATUS`, impersonation start/end | `platformController`, auth/impersonation middleware |
| Leads | `LEAD_CREATED`, `LEAD_UPDATED`, `LEAD_DELETED`, `LEAD_STATUS_CHANGED`, `LEAD_OWNER_CHANGED` | `leadController`, `chatbotService` |
| Pipeline | `PIPELINE_STAGE_CREATED/UPDATED/DELETED`, `PIPELINE_STAGE_REORDERED`, `PIPELINE_LEAD_MOVED` | `pipelineController` |
| Tasks & activities | `TASK_*`, `ACTIVITY_LOGGED/UPDATED/DELETED` | `taskController`, `activityController` |
| Assignments | `ASSIGNMENT_CREATED/UPDATED/DELETED` | `assignmentController` |
| Imports & exports | `IMPORT_STARTED/COMPLETED/FAILED`, `EXPORT_GENERATED`, file validation/template events | `importController` |
| Reports | `REPORT_GENERATED`, `REPORT_EXPORTED`, `REPORT_SCHEDULED` | `reportController` |
| Preferences | `USER_PREFERENCES_UPDATED`, `USER_PREFERENCES_RESET` | `preferencesController` |

The helper ensures that any future action can be logged by importing `logAuditEvent` and choosing the appropriate constant from `AuditActions`.

### Adding Audit Coverage to New Features

1. Import the helper:  
   ```js
   const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');
   ```
2. Identify the resource (type/id/name) and metadata to include (before/after values, counts, recipients, etc.).
3. Call `await logAuditEvent(req, { ... })` after the operation succeeds (and optionally on failure paths).
4. For long-running jobs or service‑level events without an Express `req`, supply explicit actor overrides (`actorId`, `actorEmail`, `actorRole`, `ipAddress`).
5. Extend `AuditActions` if the scenario is new; keep naming consistent (`domain_action`).

### Testing & Monitoring

- Unit tests (`backend/src/utils/__tests__/auditLogger.test.js`) verify the helper merges actor context and impersonation data correctly; run `npm test` in `backend/` to execute them.
- Each controller/service that mutates critical data now emits events; future tests should spy on `auditService.logEvent` when adding complex flows.
- Monitor Supabase table `audit_logs` for volume and insertion errors. Consider creating dashboards that track event counts per action and alert when expected activity drops to zero.
- For batch jobs, log both start and completion (or failure) with correlated metadata such as `job_id` to ease troubleshooting.

### Deployment Checklist

1. Run backend & frontend test suites (`npm test` in backend, `npm run test:run` in frontend).
2. Ensure environment variables (`SUPABASE_SERVICE_ROLE_KEY`, etc.) are present so audit inserts succeed.
3. After deployment, spot‑check `/platform/audit-logs` to confirm new actions appear with expected metadata.
4. Communicate the updated taxonomy to stakeholders and require new features to reference this document before merging.

Keeping audit coverage current is a shared responsibility. When in doubt, log it. ***
