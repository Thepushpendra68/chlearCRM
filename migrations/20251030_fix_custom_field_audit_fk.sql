-- =====================================================
-- FIX: Custom Field Audit Foreign Key Constraint
-- =====================================================
-- Problem: The trigger fires AFTER DELETE and tries to insert
-- an audit record with a foreign key to a deleted record.
-- Solution: Allow NULL for custom_field_id and use ON DELETE SET NULL
-- =====================================================

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE custom_field_audit
  DROP CONSTRAINT IF EXISTS custom_field_audit_custom_field_id_fkey;

-- Make custom_field_id nullable (for deleted fields)
ALTER TABLE custom_field_audit
  ALTER COLUMN custom_field_id DROP NOT NULL;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE custom_field_audit
  ADD CONSTRAINT custom_field_audit_custom_field_id_fkey
  FOREIGN KEY (custom_field_id)
  REFERENCES custom_field_definitions(id)
  ON DELETE SET NULL;

COMMIT;

