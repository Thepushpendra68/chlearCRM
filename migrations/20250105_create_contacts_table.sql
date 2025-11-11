-- =====================================================
-- CONTACT MANAGEMENT MODULE - PHASE 1
-- Migration: Create Contacts Table
-- Date: 2025-01-05
-- =====================================================
-- This migration creates the contacts table to support
-- full contact management with relationships to accounts
-- and leads.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE CONTACTS TABLE
-- =====================================================
-- Contacts represent individual people associated with
-- accounts. Multiple contacts can belong to one account.
-- Contacts can be linked to multiple leads (many-to-many).
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Identity fields
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  title TEXT,
  department TEXT,
  
  -- Social/Web presence
  linkedin_url TEXT,
  twitter_handle TEXT,
  
  -- Contact preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'mobile', 'linkedin')),
  do_not_call BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,
  
  -- Address
  address JSONB DEFAULT '{}',
  
  -- Relationship metadata
  is_primary BOOLEAN DEFAULT false,
  is_decision_maker BOOLEAN DEFAULT false,
  reporting_to UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Activity tracking
  last_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  
  -- Additional information
  notes TEXT,
  description TEXT,
  
  -- Status and lifecycle
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'bounced', 'unsubscribed', 'archived')),
  lifecycle_stage TEXT CHECK (lifecycle_stage IN ('lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist')),
  
  -- Assignment
  assigned_to UUID REFERENCES user_profiles(id),
  
  -- Custom fields support
  custom_fields JSONB DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Business constraint: Must have at least one contact method
  CONSTRAINT contact_method_required CHECK (
    email IS NOT NULL OR 
    phone IS NOT NULL OR 
    mobile_phone IS NOT NULL
  )
);

-- =====================================================
-- 2. CREATE LEAD_CONTACTS JUNCTION TABLE
-- =====================================================
-- Many-to-many relationship between leads and contacts
-- Allows one lead to have multiple contacts and one
-- contact to be associated with multiple leads
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Relationship metadata
  is_primary BOOLEAN DEFAULT false,
  role TEXT, -- Role of this contact for this lead (e.g., 'decision_maker', 'influencer', 'champion')
  
  -- Audit
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique lead-contact pairs
  UNIQUE(lead_id, contact_id)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_account ON contacts(company_id, account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(company_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(company_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_mobile ON contacts(company_id, mobile_phone) WHERE mobile_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_assigned ON contacts(company_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(company_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(company_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_reporting_to ON contacts(reporting_to);

-- GIN index for custom_fields JSONB queries
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields ON contacts USING GIN (custom_fields);

-- Full-text search index for names
CREATE INDEX IF NOT EXISTS idx_contacts_fulltext ON contacts USING GIN (
  to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(title, ''))
);

-- Lead_contacts junction table indexes
CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead ON lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_contact ON lead_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_company ON lead_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_primary ON lead_contacts(contact_id) WHERE is_primary = true;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES FOR CONTACTS
-- =====================================================

-- SELECT Policy: Users can see contacts in their company
-- - Admins/Managers: See all contacts in company
-- - Sales Reps: See only assigned contacts or contacts from assigned leads/accounts
CREATE POLICY "contacts_select_policy" ON contacts
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin', 'company_admin', 'manager') OR
      (
        public.get_user_role() = 'sales_rep' AND 
        (
          assigned_to = public.user_id() OR
          -- Can see contacts from their assigned accounts
          account_id IN (
            SELECT id FROM accounts WHERE assigned_to = public.user_id()
          ) OR
          -- Can see contacts from their assigned leads
          id IN (
            SELECT contact_id FROM lead_contacts 
            WHERE lead_id IN (
              SELECT id FROM leads WHERE assigned_to = public.user_id()
            )
          )
        )
      )
    )
  );

-- INSERT Policy: Users can create contacts in their company
CREATE POLICY "contacts_insert_policy" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

-- UPDATE Policy: Users can update contacts based on role
-- - Admins/Managers: Update any contact in company
-- - Sales Reps: Update only assigned contacts or contacts from assigned accounts/leads
CREATE POLICY "contacts_update_policy" ON contacts
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin', 'company_admin', 'manager') OR
      (
        public.get_user_role() = 'sales_rep' AND 
        (
          assigned_to = public.user_id() OR
          account_id IN (
            SELECT id FROM accounts WHERE assigned_to = public.user_id()
          ) OR
          id IN (
            SELECT contact_id FROM lead_contacts 
            WHERE lead_id IN (
              SELECT id FROM leads WHERE assigned_to = public.user_id()
            )
          )
        )
      )
    )
  )
  WITH CHECK (public.user_belongs_to_company(company_id));

-- DELETE Policy: Only admins can delete contacts
CREATE POLICY "contacts_delete_policy" ON contacts
  FOR DELETE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('super_admin', 'company_admin', 'manager')
  );

-- =====================================================
-- 6. CREATE RLS POLICIES FOR LEAD_CONTACTS
-- =====================================================

-- SELECT Policy: Users can see lead-contact relationships
CREATE POLICY "lead_contacts_select_policy" ON lead_contacts
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

-- INSERT Policy: Users can create lead-contact relationships
CREATE POLICY "lead_contacts_insert_policy" ON lead_contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

-- UPDATE Policy: Users can update lead-contact relationships
CREATE POLICY "lead_contacts_update_policy" ON lead_contacts
  FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

-- DELETE Policy: Users can delete lead-contact relationships
CREATE POLICY "lead_contacts_delete_policy" ON lead_contacts
  FOR DELETE TO authenticated
  USING (public.user_belongs_to_company(company_id));

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

-- Trigger for contacts updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- =====================================================
-- 8. ADD HELPER VIEWS (Basic version - will be enhanced after activities migration)
-- =====================================================

-- View to get contact with full details including account and assignments
-- Note: activities_count and tasks_count will be added after the next migration
CREATE OR REPLACE VIEW contacts_with_details AS
SELECT 
  c.*,
  a.name as account_name,
  a.industry as account_industry,
  up.first_name as assigned_user_first_name,
  up.last_name as assigned_user_last_name,
  (
    SELECT COUNT(*) FROM lead_contacts lc WHERE lc.contact_id = c.id
  ) as leads_count
FROM contacts c
LEFT JOIN accounts a ON c.account_id = a.id
LEFT JOIN user_profiles up ON c.assigned_to = up.id;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The contacts table is now ready for use.
-- Next steps:
-- 1. Add contact_id to activities table
-- 2. Add contact_id to tasks table
-- 3. Create data migration to convert leads to contacts
-- =====================================================

