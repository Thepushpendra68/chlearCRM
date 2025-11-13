insufficent.png-- =====================================================
-- CUSTOM FIELD DEFINITIONS MIGRATION
-- =====================================================
-- This migration creates tables for managing custom field definitions
-- that can be applied across the CRM (leads, contacts, companies, etc.)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE CUSTOM FIELD DEFINITIONS TABLE
-- =====================================================

-- Entity types that can have custom fields
CREATE TYPE custom_field_entity_type AS ENUM (
  'lead',
  'contact',
  'company',
  'deal',
  'task',
  'activity'
);

-- Data types for custom fields
CREATE TYPE custom_field_data_type AS ENUM (
  'text',
  'textarea',
  'number',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'select',
  'multiselect',
  'email',
  'phone',
  'url',
  'currency'
);

-- Custom field definitions
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Field identification
  field_name TEXT NOT NULL, -- Internal name (e.g., "budget_range")
  field_label TEXT NOT NULL, -- Display name (e.g., "Budget Range")
  field_description TEXT,

  -- Field configuration
  entity_type custom_field_entity_type NOT NULL,
  data_type custom_field_data_type NOT NULL,

  -- Validation rules
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  is_searchable BOOLEAN DEFAULT true,

  -- Options for select/multiselect
  field_options JSONB DEFAULT '[]'::JSONB, -- Array of options: ["Option 1", "Option 2"]

  -- Validation rules
  validation_rules JSONB DEFAULT '{}'::JSONB, -- { "min": 0, "max": 100, "pattern": "regex", etc. }

  -- Display settings
  display_order INTEGER DEFAULT 0,
  placeholder TEXT,
  help_text TEXT,
  default_value TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_field BOOLEAN DEFAULT false, -- System fields cannot be deleted

  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(company_id, entity_type, field_name)
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_custom_field_definitions_company ON custom_field_definitions(company_id);
CREATE INDEX idx_custom_field_definitions_entity_type ON custom_field_definitions(entity_type);
CREATE INDEX idx_custom_field_definitions_active ON custom_field_definitions(is_active);
CREATE INDEX idx_custom_field_definitions_field_name ON custom_field_definitions(field_name);
CREATE INDEX idx_custom_field_definitions_order ON custom_field_definitions(display_order);

-- GIN index for field_options JSONB
CREATE INDEX idx_custom_field_definitions_options ON custom_field_definitions USING GIN (field_options);

-- =====================================================
-- 3. CREATE AUDIT TABLE FOR CUSTOM FIELD CHANGES
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_field_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  custom_field_id UUID REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'activated', 'deactivated')),

  -- Changed data
  old_values JSONB,
  new_values JSONB,

  -- Audit metadata
  changed_by UUID REFERENCES user_profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_custom_field_audit_field ON custom_field_audit(custom_field_id);
CREATE INDEX idx_custom_field_audit_company ON custom_field_audit(company_id);
CREATE INDEX idx_custom_field_audit_date ON custom_field_audit(changed_at);

-- =====================================================
-- 4. CREATE FUNCTION TO UPDATE updated_at TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_custom_field_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_field_definitions_updated_at
  BEFORE UPDATE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_field_updated_at();

-- =====================================================
-- 5. CREATE FUNCTION TO LOG CUSTOM FIELD CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION log_custom_field_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO custom_field_audit (
      custom_field_id,
      company_id,
      action,
      old_values,
      changed_by
    ) VALUES (
      OLD.id,
      OLD.company_id,
      'deleted',
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO custom_field_audit (
      custom_field_id,
      company_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.company_id,
      CASE
        WHEN OLD.is_active = true AND NEW.is_active = false THEN 'deactivated'
        WHEN OLD.is_active = false AND NEW.is_active = true THEN 'activated'
        ELSE 'updated'
      END,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO custom_field_audit (
      custom_field_id,
      company_id,
      action,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'created',
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_custom_field_changes
  AFTER INSERT OR UPDATE OR DELETE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION log_custom_field_changes();

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view custom fields for their company
CREATE POLICY custom_field_definitions_select_policy ON custom_field_definitions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Company admins and managers can create custom fields
CREATE POLICY custom_field_definitions_insert_policy ON custom_field_definitions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

-- Policy: Company admins and managers can update custom fields
CREATE POLICY custom_field_definitions_update_policy ON custom_field_definitions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
    AND (is_system_field = false) -- System fields cannot be modified
  );

-- Policy: Only company admins can delete custom fields
CREATE POLICY custom_field_definitions_delete_policy ON custom_field_definitions
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin')
    )
    AND (is_system_field = false) -- System fields cannot be deleted
  );

-- Policy: Users can view audit logs for their company
CREATE POLICY custom_field_audit_select_policy ON custom_field_audit
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 7. CREATE VIEW FOR CUSTOM FIELD USAGE STATISTICS
-- =====================================================

CREATE OR REPLACE VIEW custom_field_usage_stats AS
SELECT
  cfd.id,
  cfd.company_id,
  cfd.field_name,
  cfd.field_label,
  cfd.entity_type,
  cfd.data_type,
  cfd.is_active,

  -- Count usage in leads (checking custom_fields JSONB)
  (
    SELECT COUNT(*)
    FROM leads
    WHERE company_id = cfd.company_id
    AND custom_fields ? cfd.field_name
  ) AS usage_count_leads,

  -- Get unique values count
  (
    SELECT COUNT(DISTINCT custom_fields->>cfd.field_name)
    FROM leads
    WHERE company_id = cfd.company_id
    AND custom_fields ? cfd.field_name
  ) AS unique_values_count,

  -- Last used timestamp
  (
    SELECT MAX(created_at)
    FROM leads
    WHERE company_id = cfd.company_id
    AND custom_fields ? cfd.field_name
  ) AS last_used_at,

  cfd.created_at,
  cfd.updated_at
FROM custom_field_definitions cfd
WHERE cfd.entity_type = 'lead';

-- =====================================================
-- 8. INSERT DEFAULT CUSTOM FIELDS (OPTIONAL)
-- =====================================================

-- Note: This section is commented out.
-- Uncomment and customize for your specific needs.

/*
-- Example: Insert common custom fields for leads
INSERT INTO custom_field_definitions (
  company_id,
  field_name,
  field_label,
  field_description,
  entity_type,
  data_type,
  field_options,
  display_order,
  is_active
) VALUES
  -- Budget field
  (
    (SELECT id FROM companies LIMIT 1), -- Replace with actual company_id
    'budget',
    'Budget',
    'Expected budget range for the project',
    'lead',
    'select',
    '["< $10,000", "$10,000 - $50,000", "$50,000 - $100,000", "> $100,000"]'::JSONB,
    1,
    true
  ),
  -- Timeline field
  (
    (SELECT id FROM companies LIMIT 1),
    'timeline',
    'Timeline',
    'Expected project timeline',
    'lead',
    'select',
    '["Immediate", "1-3 months", "3-6 months", "6+ months"]'::JSONB,
    2,
    true
  ),
  -- Company size field
  (
    (SELECT id FROM companies LIMIT 1),
    'company_size',
    'Company Size',
    'Number of employees',
    'lead',
    'select',
    '["1-10", "11-50", "51-200", "201-500", "500+"]'::JSONB,
    3,
    true
  );
*/

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (Run this to undo migration)
-- =====================================================

/*
BEGIN;

-- Drop views
DROP VIEW IF EXISTS custom_field_usage_stats;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_log_custom_field_changes ON custom_field_definitions;
DROP TRIGGER IF EXISTS trigger_custom_field_definitions_updated_at ON custom_field_definitions;

-- Drop functions
DROP FUNCTION IF EXISTS log_custom_field_changes();
DROP FUNCTION IF EXISTS update_custom_field_updated_at();

-- Drop tables
DROP TABLE IF EXISTS custom_field_audit;
DROP TABLE IF EXISTS custom_field_definitions;

-- Drop types
DROP TYPE IF EXISTS custom_field_data_type;
DROP TYPE IF EXISTS custom_field_entity_type;

COMMIT;
*/

