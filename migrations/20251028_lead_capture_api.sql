-- =====================================================
-- LEAD CAPTURE API - DATABASE MIGRATION
-- =====================================================
-- This migration adds support for external lead capture via API
-- Allows clients to integrate their landing pages with the CRM
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE API CLIENTS TABLE
-- =====================================================

-- API Clients for external lead capture
CREATE TABLE IF NOT EXISTS api_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  api_secret_hash TEXT NOT NULL, -- bcrypt hashed secret
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100, -- requests per hour
  allowed_origins TEXT[], -- CORS origins allowed
  webhook_url TEXT, -- Optional webhook for notifications
  custom_field_mapping JSONB DEFAULT '{}', -- Map custom fields to lead fields
  default_lead_source TEXT DEFAULT 'api',
  default_assigned_to UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE API CLIENT REQUESTS TABLE (USAGE TRACKING)
-- =====================================================

CREATE TABLE IF NOT EXISTS api_client_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  error_message TEXT,
  lead_id UUID REFERENCES leads(id), -- Link to created lead if successful
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_api_clients_company ON api_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_api_clients_api_key ON api_clients(api_key);
CREATE INDEX IF NOT EXISTS idx_api_clients_active ON api_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_api_clients_created_by ON api_clients(created_by);

CREATE INDEX IF NOT EXISTS idx_api_client_requests_client ON api_client_requests(api_client_id);
CREATE INDEX IF NOT EXISTS idx_api_client_requests_created ON api_client_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_api_client_requests_lead ON api_client_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_api_client_requests_status ON api_client_requests(status_code);

-- =====================================================
-- 4. ADD CUSTOM FIELDS COLUMN TO LEADS TABLE
-- =====================================================

-- Add custom_fields JSONB column to store additional form data
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Add index for custom fields queries
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields ON leads USING GIN (custom_fields);

-- =====================================================
-- 5. CREATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on api_clients table
ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;

-- API clients policies
CREATE POLICY "api_clients_select_policy" ON api_clients
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "api_clients_insert_policy" ON api_clients
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "api_clients_update_policy" ON api_clients
  FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "api_clients_delete_policy" ON api_clients
  FOR DELETE TO authenticated
  USING (public.user_belongs_to_company(company_id));

-- Enable RLS on api_client_requests table
ALTER TABLE api_client_requests ENABLE ROW LEVEL SECURITY;

-- API client requests policies (only viewable by company that owns the API client)
CREATE POLICY "api_client_requests_select_policy" ON api_client_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api_clients ac
      WHERE ac.id = api_client_requests.api_client_id
      AND public.user_belongs_to_company(ac.company_id)
    )
  );

-- =====================================================
-- 6. CREATE HELPFUL VIEWS
-- =====================================================

-- View for API client statistics
CREATE OR REPLACE VIEW api_client_stats AS
SELECT
  ac.id,
  ac.company_id,
  ac.client_name,
  ac.api_key,
  ac.is_active,
  ac.rate_limit,
  ac.last_used_at,
  ac.created_at,
  COUNT(DISTINCT acr.id) as total_requests,
  COUNT(DISTINCT acr.id) FILTER (WHERE acr.status_code >= 200 AND acr.status_code < 300) as successful_requests,
  COUNT(DISTINCT acr.id) FILTER (WHERE acr.status_code >= 400) as failed_requests,
  COUNT(DISTINCT acr.lead_id) as leads_created,
  AVG(acr.response_time_ms)::INTEGER as avg_response_time_ms,
  MAX(acr.created_at) as last_request_at
FROM api_clients ac
LEFT JOIN api_client_requests acr ON acr.api_client_id = ac.id
GROUP BY ac.id, ac.company_id, ac.client_name, ac.api_key, ac.is_active, ac.rate_limit, ac.last_used_at, ac.created_at;

-- =====================================================
-- 7. CREATE AUDIT LOG ENTRIES
-- =====================================================

-- Add new audit action types (if not already exist)
DO $$
BEGIN
  -- These will be used in the application code
  -- API_CLIENT_CREATED, API_CLIENT_UPDATED, API_CLIENT_DELETED
  -- LEAD_CAPTURED_VIA_API, API_KEY_REGENERATED
  RAISE NOTICE 'Audit log action types will be handled by application code';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 'api_clients' as table_name, COUNT(*) as row_count FROM api_clients
UNION ALL
SELECT 'api_client_requests', COUNT(*) FROM api_client_requests;

-- Verify indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('api_clients', 'api_client_requests')
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('api_clients', 'api_client_requests')
AND schemaname = 'public';

-- Success message
SELECT '✅ Lead Capture API migration completed successfully!' as status;

