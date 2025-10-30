-- =====================================================
-- CUSTOM FIELD DEFINITIONS MIGRATION (FIXED)
-- =====================================================
-- This migration creates tables for managing custom field definitions
-- Fixed to work with backend service role authentication
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE ENUM TYPES (IF NOT EXISTS)
-- =====================================================

-- Entity types that can have custom fields
DO $$ BEGIN
    CREATE TYPE custom_field_entity_type AS ENUM (
      'lead',
      'contact',
      'company',
      'deal',
      'task',
      'activity'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Data types for custom fields
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE CUSTOM FIELD DEFINITIONS TABLE
-- =====================================================

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
  field_options JSONB DEFAULT '[]'::JSONB,
  
  -- Validation rules
  validation_rules JSONB DEFAULT '{}'::JSONB,
  
  -- Display settings
  display_order INTEGER DEFAULT 0,
  placeholder TEXT,
  help_text TEXT,
  default_value TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_field BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, entity_type, field_name)
);

-- =====================================================
-- 3. CREATE CUSTOM FIELD AUDIT TABLE
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

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_company ON custom_field_definitions(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_entity_type ON custom_field_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_active ON custom_field_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_field_name ON custom_field_definitions(field_name);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_order ON custom_field_definitions(display_order);

-- GIN index for field_options JSONB
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_options ON custom_field_definitions USING GIN (field_options);

CREATE INDEX IF NOT EXISTS idx_custom_field_audit_field ON custom_field_audit(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_audit_company ON custom_field_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_audit_date ON custom_field_audit(changed_at);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS user_belongs_to_company(UUID);
DROP FUNCTION IF EXISTS user_has_role(UUID, TEXT[]);

-- Helper function to check if user belongs to company (works with auth.uid() or direct checks)
CREATE FUNCTION user_belongs_to_company(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- If auth.uid() is null, we're using service role - allow access
  IF auth.uid() IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise check if user belongs to the company
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND company_id = check_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user role
CREATE FUNCTION user_has_role(check_company_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- If auth.uid() is null, we're using service role - allow access
  IF auth.uid() IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise check if user has the required role
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND company_id = check_company_id
    AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_custom_field_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_field_definitions_updated_at ON custom_field_definitions;
CREATE TRIGGER trigger_custom_field_definitions_updated_at
  BEFORE UPDATE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_field_updated_at();

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

DROP TRIGGER IF EXISTS trigger_log_custom_field_changes ON custom_field_definitions;
CREATE TRIGGER trigger_log_custom_field_changes
  AFTER INSERT OR UPDATE OR DELETE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION log_custom_field_changes();

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS custom_field_definitions_select_policy ON custom_field_definitions;
DROP POLICY IF EXISTS custom_field_definitions_insert_policy ON custom_field_definitions;
DROP POLICY IF EXISTS custom_field_definitions_update_policy ON custom_field_definitions;
DROP POLICY IF EXISTS custom_field_definitions_delete_policy ON custom_field_definitions;
DROP POLICY IF EXISTS custom_field_audit_select_policy ON custom_field_audit;

-- Policy: Users can view custom fields for their company
CREATE POLICY custom_field_definitions_select_policy ON custom_field_definitions
  FOR SELECT
  USING (user_belongs_to_company(company_id));

-- Policy: Company admins and managers can create custom fields
CREATE POLICY custom_field_definitions_insert_policy ON custom_field_definitions
  FOR INSERT
  WITH CHECK (user_has_role(company_id, ARRAY['super_admin', 'company_admin', 'manager']));

-- Policy: Company admins and managers can update custom fields (except system fields)
CREATE POLICY custom_field_definitions_update_policy ON custom_field_definitions
  FOR UPDATE
  USING (
    user_has_role(company_id, ARRAY['super_admin', 'company_admin', 'manager'])
    AND is_system_field = false
  );

-- Policy: Only company admins can delete custom fields
CREATE POLICY custom_field_definitions_delete_policy ON custom_field_definitions
  FOR DELETE
  USING (
    user_has_role(company_id, ARRAY['super_admin', 'company_admin'])
    AND is_system_field = false
  );

-- Policy: Users can view audit logs for their company
CREATE POLICY custom_field_audit_select_policy ON custom_field_audit
  FOR SELECT
  USING (user_belongs_to_company(company_id));

-- =====================================================
-- 8. CREATE VIEW FOR USAGE STATISTICS
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
  
  -- Count usage in leads
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

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'custom_field_definitions' as table_name, COUNT(*) as row_count FROM custom_field_definitions
UNION ALL
SELECT 'custom_field_audit', COUNT(*) FROM custom_field_audit;

SELECT '✅ Custom Field Definitions migration completed successfully!' as status;

