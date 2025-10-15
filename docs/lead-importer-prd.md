# Lead Import Revamp PRD

## Document Control
- **Author:** Codex assistant (on behalf of CRM platform squad)
- **Date:** 2025-10-14
- **Status:** Draft for review
- **Stakeholders:** Growth Ops, Sales Enablement, CRM Core Engineering, QA Automation, Customer Success

## Background & Problem Statement
The current bulk lead import flow validates rows only during the insert pass and hard-fails the entire batch when important fields are missing or malformed. Operators frequently run into blockers when uploading partner-supplied spreadsheets that contain subtle mapping differences (localized headers, alternate status values, inconsistent phone formatting, etc.). Each failure requires manual spreadsheet clean-up, slowing down onboarding and risking data loss. 

### Observed Pain Points
- Repeated validation failures on otherwise usable datasets (missing last names, local phone formats, mixed status labels).
- Hard-coded enumerations in the service layer require code changes for new pipeline statuses or acquisition sources.
- Duplicate checks perform per-row queries, creating latency and occasionally timing out on large files.
- Import UI offers minimal guidance—users see only a binary success/failure message and must edit CSV/Excel files offline.
- No ability to stage or review parsed data before it is pushed into production tables.
- Limited telemetry on why imports fail, making it difficult to identify systemic issues.

## Goals & Success Criteria
1. **Reduce failed imports**: 80% of imports should complete successfully on the first attempt within one month of rollout.
2. **Improve operator confidence**: Provide actionable preview and editing tools so users can resolve validation errors in-app.
3. **Lower engineering overhead**: Externalize validation rules to configuration, allowing ops to adjust required fields and enum mappings without code deployments.
4. **Increase observability**: Track validation error categories and import outcomes to drive continuous improvements.

### Non-Goals
- Building a full ETL pipeline or scheduler for recurring imports.
- Modifying underlying Supabase schema beyond what is needed to support configuration and observability.
- Supporting file formats beyond CSV/XLSX in this iteration.

## Personas & Use Cases
- **Sales Ops Manager (Primary)**: Cleans partner lead lists and needs fast, accurate imports with sufficient feedback.
- **RevOps Analyst (Secondary)**: Runs periodic data syncs from other tools and wants to maintain custom mappings for each source.
- **Customer Success (Tertiary)**: Occasionally bulk-imports legacy customer data and needs to resolve data hygiene issues quickly.

## User Stories
1. As a Sales Ops manager, I can upload a CSV/XLSX file and run a *dry run* validation that highlights all problematic rows without altering data in Supabase.
2. As a RevOps analyst, I can adjust column mappings (including saving presets per source) so subsequent imports auto-map correctly.
3. As a Sales Ops manager, I can see a grid preview of parsed rows, correct invalid values inline, and revalidate immediately.
4. As an administrator, I can configure required fields, allowed enums, and duplicate resolution policies per company without redeploying code.
5. As a user, I can choose to import only valid rows while exporting the failed ones to CSV/Excel for offline follow-up.
6. As a platform engineer, I can monitor import success rates and the most common validation failures via dashboards and alerts.

## High-Level Requirements
### Functional Requirements
- Support **Validation Modes**: `DryRun` (analysis only) and `Apply` (write valid rows + optional skip/fix strategy).
- Provide **Row-Level Feedback** including: row number, original values, normalized values, and guidance messages.
- Enable **Inline Editing UI** with bulk actions (clear column, set default) and revalidation for edited rows.
- Persist **Field Mapping Presets** tied to user/company/source; auto-suggest on subsequent imports.
- Allow **Duplicate Handling Policies**: `skip`, `update`, `upsert` (future), configured per import.
- Surface **Downloadable Error Reports** (CSV/XLSX) containing failures and remediation hints.
- Record **Import History** entries with structured metadata (mode, counts, policy settings, top errors).

### Non-Functional Requirements
- Validate up to 50k rows per import in <60 seconds for dry run and <90 seconds when applying changes.
- Ensure the system gracefully handles partial failures and remains idempotent when re-running the same file.
- Maintain auditability by logging who changed validation policies and when imports occurred.

## UX Flow Overview
1. User selects file and optional preset → system detects headers, suggests mappings → user confirms or refines.
2. User triggers dry run → backend returns parsed dataset, validation results, and aggregated issues.
3. UI renders a tabular preview with filters (error type, column) and inline edit controls for each invalid value.
4. User edits entries or applies bulk fixes → revalidates edited rows client-side (basic checks) before calling backend to re-run server validation.
5. When satisfied, user selects import mode: `Import Valid Only` or `Import All (update or skip duplicates)`.
6. Backend performs batch insert/update, returns summary, and triggers toast + optional error download link.
7. Import history panel updates with latest run, linking to stored reports and metrics.

## Technical Design
### Backend Changes (Express + Supabase)
- **Validation Service Refactor**
  - Introduce a `ValidationEngine` module that accepts schema configuration (required fields, allowed enums, value transformers) loaded per company/tenant.
  - Batch-scan duplicates by collecting unique keys (email, phone) and querying Supabase once using `in` filters; reuse results across rows.
  - Add pluggable rule set to support new checks (regex, min/max, cross-field dependencies).
- **Dry Run Endpoint**
  - `POST /api/imports/leads/validate` → parses file, applies validation rules, returns structured result without touching DB.
  - Response shape: `{ rows: [...], stats: {...}, errors: [...], warnings: [...] }` with pagination for large files.
- **Apply Endpoint Enhancements**
  - Accept payload specifying imported rows, selected duplicate policy, and confirmed mappings.
  - Add transactional bulk insert/update using Supabase RPC or SQL stored procedure to ensure atomicity.
  - Support `skip` duplicates mode (omit conflicting rows) and `update` mode (merge with existing records).
- **Configuration Storage**
  - Create `import_configs` table keyed by company, storing JSON schema (required fields, enums, transformers, duplicate policy defaults).
  - Add API for admins to read/update configurations with auditing (created_by, updated_at).
- **Mapping Presets**
  - Persist mapping definitions (`import_mappings` table) capturing header → field decisions per source/user.
  - Apply heuristics server-side to auto-match future uploads with stored presets.
- **Observability**
  - Emit structured logs (batch ID, validation stats, duplicate counts).
  - Push metrics to existing telemetry pipeline (e.g., Supabase function or external logging service).
  - Extend `import_history` to store summary JSON with top error categories and links to error files.

### Frontend Changes (Vite React)
- Implement multi-step `LeadImportWizard` with states: `Upload`, `Mapping`, `Preview`, `Review`, `Summary`.
- Build reusable `DataGrid` component with inline validation states, tooltips, and bulk editing actions.
- Add client-side validators mirroring backend rules for instant feedback (leveraging shared JSON schema fetched at session start).
- Provide preset management UI (dropdown + modal to save/update presets).
- Integrate download links for error reports and expose import history timeline.
- Ensure accessibility (keyboard navigation, ARIA roles) and responsive layout for wide spreadsheets.

### Data Model Updates
- `import_configs` table (company_id, schema_json, duplicate_policy_default, created_by, updated_at).
- `import_mappings` table (company_id, source_key, mapping_json, created_by, usage_count, last_used_at).
- Extend `import_history` to include `mode`, `duplicate_policy`, `config_version`, `error_report_url`, `error_top_categories`.

### Security & Permissions
- Only admin-level users can modify import configurations and presets for the entire company.
- Import endpoints enforce that acting user belongs to the target company; ensure audit logs capture user IDs.
- Sanitise uploaded content, limit file size, and scan for potential formula injection in exported error reports.

## Rollout Plan
1. **Prototype (Sprint 1-2)**
   - Build backend validation engine + dry run endpoint.
   - Implement frontend dry run flow with basic grid (read-only).
2. **Extended Functionality (Sprint 3-4)**
   - Add inline editing, duplicate policies, and preset storage.
   - Harden backend apply flow with transactional writes.
3. **Observability & Polish (Sprint 5)**
   - Instrument metrics, finalize error report downloads, update documentation.
   - Conduct UX validation with Sales Ops stakeholders.
4. **Rollout & Adoption (Sprint 6)**
   - Pilot with two high-volume customers.
   - Gather feedback, iterate, then enable for all tenants.

## Metrics & Monitoring
- **Success Rate**: percentage of imports completing without user re-upload.
- **Time to First Successful Import**: average elapsed time between first upload attempt and successful import.
- **Error Distribution**: top validation error categories per week.
- **Throughput**: average rows processed per minute per import mode.
- **Telemetry Sources**: `import_history.summary` and the new `import_telemetry` table expose validation/import stats, timings, duplicate policy, and warning counts. Each backend run also emits `[ImportTelemetry]` structured logs for your observability pipeline. See `docs/lead-importer-observability.md` for querying guidance.

## Risks & Mitigations
- **Performance regressions**: large dry runs may consume significant memory. *Mitigation*: stream processing, paginate response, enforce file size limits.
- **Schema drift**: configuration stored in DB must stay in sync with Supabase columns. *Mitigation*: nightly job to verify config vs actual schema and alert on mismatch.
- **User adoption**: complex wizard may overwhelm occasional users. *Mitigation*: contextual help, templates, fallback quick-import mode.
- **Data integrity**: update policy could overwrite important fields. *Mitigation*: honor field-level locks and require confirmation before enabling `update` mode; log all changes.

## Open Questions
- Should duplicate resolution support fuzzy matching (e.g., email aliases, phone normalization beyond digits)?
- Do we need role-specific presets or global defaults per company/source?
- What retention policy should apply for stored error reports and raw import files?

## Next Actions
- Review PRD with stakeholders, collect feedback, and sign off.
- Begin backend spike to prototype validation engine and dry run endpoint per plan.
- Align frontend roadmap and resource allocation with the new multi-step wizard.
