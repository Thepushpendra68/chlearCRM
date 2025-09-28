-- Performance optimization SQL script
-- Creates indexes for foreign keys and frequently queried columns
-- Run this directly in Supabase SQL Editor

-- Add indexes for foreign keys that are missing
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_company_id ON import_history(company_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created_by ON import_history(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_assignment_rules_assigned_to ON lead_assignment_rules(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage_id ON leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_company_id ON pipeline_stages(company_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_company_status_created ON leads(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_company_assigned_status ON leads(company_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status_created ON leads(assigned_to, status, created_at);
CREATE INDEX IF NOT EXISTS idx_activities_company_created_type ON activities(company_id, created_at DESC, type);

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_leads_active_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_company ON user_profiles(company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_active_assigned ON tasks(assigned_to) WHERE status != 'completed';

-- Add some additional performance indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_leads_company_created_at ON leads(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_updated_at ON leads(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created_at_desc ON activities(created_at DESC);

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add a comment to track when these indexes were created
COMMENT ON SCHEMA public IS 'Performance indexes added on ' || NOW()::text;