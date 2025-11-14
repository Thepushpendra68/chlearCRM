-- =====================================================
-- ADD USER PREFERENCES TABLE
-- =====================================================
-- This migration adds a user_preferences table to store
-- individual user settings and preferences
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE USER_PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,

  -- Display preferences
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  items_per_page INTEGER DEFAULT 20 CHECK (items_per_page >= 10 AND items_per_page <= 100),
  default_view TEXT DEFAULT 'list' CHECK (default_view IN ('list', 'grid', 'kanban')),
  dashboard_widgets JSONB DEFAULT '{"show_recent_leads": true, "show_tasks": true, "show_activities": true, "show_pipeline": true}'::jsonb,

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  email_lead_assigned BOOLEAN DEFAULT true,
  email_lead_updated BOOLEAN DEFAULT false,
  email_task_assigned BOOLEAN DEFAULT true,
  email_task_due BOOLEAN DEFAULT true,
  email_daily_digest BOOLEAN DEFAULT false,
  email_weekly_digest BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,

  -- Language & Regional settings
  date_format TEXT DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Users can only select their own preferences
CREATE POLICY "user_preferences_select_policy" ON user_preferences
  FOR SELECT TO authenticated
  USING (user_id = public.user_id());

-- Users can only update their own preferences
CREATE POLICY "user_preferences_update_policy" ON user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = public.user_id())
  WITH CHECK (user_id = public.user_id());

-- Users can only insert their own preferences
CREATE POLICY "user_preferences_insert_policy" ON user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.user_id());

-- Users can only delete their own preferences
CREATE POLICY "user_preferences_delete_policy" ON user_preferences
  FOR DELETE TO authenticated
  USING (user_id = public.user_id());

-- =====================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 6. CREATE FUNCTION TO GET OR CREATE USER PREFERENCES
-- =====================================================

CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS user_preferences AS $$
DECLARE
  v_preferences user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM user_preferences
  WHERE user_id = p_user_id;

  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Run this migration in Supabase SQL Editor or via:
-- supabase db push (if using local development)
-- =====================================================
