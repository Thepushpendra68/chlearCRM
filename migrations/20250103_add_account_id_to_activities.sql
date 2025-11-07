-- =====================================================
-- ACCOUNT MANAGEMENT MODULE - PHASE 1
-- Migration: Add account_id to activities table
-- Date: 2025-01-03
-- =====================================================
-- SAFETY: Optional enhancement. Activities can be
-- linked to accounts OR leads. Both are nullable.
-- Existing activities remain unchanged.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD ACCOUNT_ID COLUMN TO ACTIVITIES TABLE
-- =====================================================
-- This allows activities to be associated with accounts
-- in addition to (or instead of) leads.
-- =====================================================

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Account-based activity queries
CREATE INDEX IF NOT EXISTS idx_activities_account ON activities(account_id);

-- Company + Account composite index
CREATE INDEX IF NOT EXISTS idx_activities_company_account ON activities(company_id, account_id);

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Activities table now supports account linking.
-- All existing activities have account_id = NULL (safe).
-- Next step: Add account_id to tasks table
-- =====================================================

