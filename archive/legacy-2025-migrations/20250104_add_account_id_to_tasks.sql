-- =====================================================
-- ACCOUNT MANAGEMENT MODULE - PHASE 1
-- Migration: Add account_id to tasks table
-- Date: 2025-01-04
-- =====================================================
-- SAFETY: Optional enhancement. Tasks can be
-- linked to accounts OR leads. Both are nullable.
-- Existing tasks remain unchanged.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD ACCOUNT_ID COLUMN TO TASKS TABLE
-- =====================================================
-- This allows tasks to be associated with accounts
-- in addition to (or instead of) leads.
-- =====================================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Account-based task queries
CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(account_id);

-- Company + Account composite index
CREATE INDEX IF NOT EXISTS idx_tasks_company_account ON tasks(company_id, account_id);

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tasks table now supports account linking.
-- All existing tasks have account_id = NULL (safe).
-- Phase 1 Complete! Ready for Phase 2 (Backend API)
-- =====================================================

