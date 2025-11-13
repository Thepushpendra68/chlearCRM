# Archived SQL Files

This directory contains legacy SQL migration files that have been archived to maintain a clean repository structure.

## Why These Were Archived

These files were moved here because they are:
- **Legacy versions** of features now in newer consolidated migrations
- **Deprecated** implementations superseded by stable versions
- **Helper/utility scripts** not needed in production
- **Early migration chain** replaced by the current 2-phase migration system

## Migration Path (Do NOT Run These)

⚠️ **IMPORTANT**: Do NOT run these archived files! They are kept for historical reference only.

### Current Production Migration Path
For new Supabase projects, use these active files:

1. `migrations/20251112_001_primary_core_schema.sql` (Phase 1)
2. `migrations/20251112_002_secondary_platform_features.sql` (Phase 2)
3. `migrations/20251031_email_templates_and_automation.sql`
4. `migrations/20251028_lead_capture_api.sql`
5. `migrations/20251101_workflow_library.sql`
6. `create_user_profiles_with_auth_view.sql`

Or run the all-in-one script:
- `run_this_in_supabase.sql`

## Directory Structure

### `/legacy-custom-fields/`
Old custom field implementations replaced by:
- `migrations/20251029_custom_field_definitions_SAFE.sql`

### `/legacy-2025-migrations/`
Early sequential migration chain replaced by:
- `migrations/20251112_001_primary_core_schema.sql`
- `migrations/20251112_002_secondary_platform_features.sql`

### `/legacy-import-system/`
Import system components (may be superseded by newer implementation)

### `/legacy-lead-features/`
Legacy lead management features (now in main schema)

### `/utility-files/`
Testing and verification utilities

## Last Archived
Date: 2025-11-13
Reason: Repository structure cleanup - consolidating to 2-phase migration system

---
**Note**: If you need to reference these files for historical context or debugging, they remain available here. However, for any new deployments or setups, always use the active migration files listed above.
