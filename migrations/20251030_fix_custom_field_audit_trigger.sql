-- =====================================================
-- FIX: Custom Field Audit trigger timing and FK behavior
-- =====================================================
-- Problem: AFTER DELETE trigger inserts audit row after parent is gone,
-- which violates FK even with ON DELETE SET NULL at insert time.
-- Solution: Split trigger timings:
--  - AFTER INSERT OR UPDATE → keep same
--  - BEFORE DELETE → insert audit before parent row is removed
-- Additionally ensure FK uses ON DELETE SET NULL and column is nullable.
-- =====================================================

BEGIN;

-- Ensure FK permits keeping history on delete
ALTER TABLE custom_field_audit
  DROP CONSTRAINT IF EXISTS custom_field_audit_custom_field_id_fkey;

ALTER TABLE custom_field_audit
  ALTER COLUMN custom_field_id DROP NOT NULL;

ALTER TABLE custom_field_audit
  ADD CONSTRAINT custom_field_audit_custom_field_id_fkey
  FOREIGN KEY (custom_field_id)
  REFERENCES custom_field_definitions(id)
  ON DELETE SET NULL;

-- Replace the single AFTER trigger with two triggers
DROP TRIGGER IF EXISTS trigger_log_custom_field_changes ON custom_field_definitions;
DROP TRIGGER IF EXISTS trigger_log_custom_field_changes_aiu ON custom_field_definitions;
DROP TRIGGER IF EXISTS trigger_log_custom_field_changes_bd ON custom_field_definitions;

-- AFTER INSERT or UPDATE (unchanged timing)
CREATE TRIGGER trigger_log_custom_field_changes_aiu
  AFTER INSERT OR UPDATE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION log_custom_field_changes();

-- BEFORE DELETE so parent still exists at insert time
CREATE TRIGGER trigger_log_custom_field_changes_bd
  BEFORE DELETE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION log_custom_field_changes();

COMMIT;
