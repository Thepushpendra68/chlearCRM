-- =====================================================
-- CONTACT MANAGEMENT MODULE - PHASE 2
-- Migration: Add contact support to activities and tasks
-- Date: 2025-01-06
-- =====================================================
-- This migration extends activities and tasks tables
-- to support direct contact associations
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD CONTACT_ID TO ACTIVITIES
-- =====================================================

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Create index for contact-based queries
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_contact ON activities(company_id, contact_id);

-- =====================================================
-- 2. ADD CONTACT_ID TO TASKS
-- =====================================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Create index for contact-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_contact ON tasks(company_id, contact_id);

-- =====================================================
-- 3. UPDATE ACTIVITIES TRIGGER FOR CONTACT TRACKING
-- =====================================================

-- Function to update contact's last_contacted_at when activity is created
CREATE OR REPLACE FUNCTION update_contact_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact's last_activity_at and last_contacted_at
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts
    SET
      last_activity_at = NEW.created_at,
      last_contacted_at = CASE
        WHEN NEW.type IN ('call', 'email', 'meeting') THEN NEW.created_at
        ELSE last_contacted_at
      END
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_update_contact_trigger
  AFTER INSERT ON activities
  FOR EACH ROW
  WHEN (NEW.contact_id IS NOT NULL)
  EXECUTE FUNCTION update_contact_last_activity();

-- =====================================================
-- 4. UPDATE CONTACTS VIEW WITH ACTIVITY/TASK COUNTS
-- =====================================================

-- Now that contact_id exists in activities and tasks, update the view
CREATE OR REPLACE VIEW contacts_with_details AS
SELECT
  c.*,
  a.name as account_name,
  a.industry as account_industry,
  up.first_name as assigned_user_first_name,
  up.last_name as assigned_user_last_name,
  (
    SELECT COUNT(*) FROM lead_contacts lc WHERE lc.contact_id = c.id
  ) as leads_count,
  (
    SELECT COUNT(*) FROM activities act WHERE act.contact_id = c.id
  ) as activities_count,
  (
    SELECT COUNT(*) FROM tasks t WHERE t.contact_id = c.id
  ) as tasks_count
FROM contacts c
LEFT JOIN accounts a ON c.account_id = a.id
LEFT JOIN user_profiles up ON c.assigned_to = up.id;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Activities and tasks now support contact associations
-- Contact tracking is automatically updated
-- View updated with activity and task counts
-- =====================================================

