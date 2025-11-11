-- =====================================================
-- ACCOUNT MANAGEMENT MODULE - PHASE 1
-- Migration: Add account_id to leads table
-- Date: 2025-01-02
-- =====================================================
-- SAFETY: This adds a NULLABLE column. All existing
-- leads will have account_id = NULL. No data loss.
-- Existing code continues to work unchanged.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD ACCOUNT_ID COLUMN TO LEADS TABLE
-- =====================================================
-- This column links leads to accounts (organizations).
-- It's nullable to maintain backward compatibility.
-- =====================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Account-based queries
CREATE INDEX IF NOT EXISTS idx_leads_account ON leads(account_id);

-- Company + Account composite index (common query pattern)
CREATE INDEX IF NOT EXISTS idx_leads_company_account ON leads(company_id, account_id);

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Leads table now supports account linking.
-- All existing leads have account_id = NULL (safe).
-- Next step: Add account_id to activities table
-- =====================================================

