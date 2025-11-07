-- =====================================================
-- ACCOUNT MANAGEMENT MODULE - PHASE 1
-- Migration: Create Accounts Table
-- Date: 2025-01-01
-- =====================================================
-- SAFETY: This creates a NEW table only. No existing
-- tables or data are modified. Completely safe to run.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE ACCOUNTS TABLE
-- =====================================================
-- Accounts represent organizations/companies that can
-- have multiple leads associated with them.
-- Supports hierarchical structure (parent/child accounts)
-- =====================================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  phone TEXT,
  email TEXT,
  address JSONB DEFAULT '{}',
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  description TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Company-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);

-- Parent-child relationship queries
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_account_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(company_id, status);

-- Assignment filtering
CREATE INDEX IF NOT EXISTS idx_accounts_assigned ON accounts(company_id, assigned_to);

-- Name search
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(company_id, name);

-- Created date sorting
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);

-- GIN index for custom_fields JSONB queries
CREATE INDEX IF NOT EXISTS idx_accounts_custom_fields ON accounts USING GIN (custom_fields);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================
-- Following the same pattern as leads table policies
-- =====================================================

-- SELECT Policy: Users can see accounts in their company
-- - Admins/Managers: See all accounts in company
-- - Sales Reps: See only assigned accounts
CREATE POLICY "accounts_select_policy" ON accounts
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin', 'company_admin', 'manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  );

-- INSERT Policy: Users can create accounts in their company
CREATE POLICY "accounts_insert_policy" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

-- UPDATE Policy: Users can update accounts based on role
-- - Admins/Managers: Update any account in company
-- - Sales Reps: Update only assigned accounts
CREATE POLICY "accounts_update_policy" ON accounts
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin', 'company_admin', 'manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  )
  WITH CHECK (public.user_belongs_to_company(company_id));

-- DELETE Policy: Only admins can delete accounts
CREATE POLICY "accounts_delete_policy" ON accounts
  FOR DELETE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('super_admin', 'company_admin', 'manager')
  );

-- =====================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at_trigger
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The accounts table is now ready for use.
-- Next step: Add account_id to leads table
-- =====================================================

