-- Voice Interface Database Schema (FINAL SUPABASE VERSION)
-- Migration: Create voice-related tables for CHLEAR CRM
-- Date: November 13, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- Companies Table (if not exists)
-- =====================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- User Voice Settings
-- =====================================
CREATE TABLE IF NOT EXISTS user_voice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- TEXT to match auth.users.id (stored as UUID but accessed as text)
  company_id UUID, -- References companies.id (can be NULL initially)
  enabled BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en-US',
  auto_speak BOOLEAN DEFAULT true,
  voice_activation BOOLEAN DEFAULT false,
  wake_word VARCHAR(50) DEFAULT 'Hey Sakha',
  rate DECIMAL(3,1) DEFAULT 1.0,
  pitch DECIMAL(3,1) DEFAULT 1.0,
  volume DECIMAL(3,1) DEFAULT 1.0,
  silence_delay INTEGER DEFAULT 5000,
  store_voice_notes BOOLEAN DEFAULT true,
  allow_voice_analytics BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one setting per user
  UNIQUE(user_id),

  -- Add constraints separately
  CONSTRAINT check_rate_range CHECK (rate >= 0.5 AND rate <= 2.0),
  CONSTRAINT check_pitch_range CHECK (pitch >= 0.5 AND pitch <= 2.0),
  CONSTRAINT check_volume_range CHECK (volume >= 0.0 AND volume <= 1.0),
  CONSTRAINT check_silence_delay_range CHECK (silence_delay >= 1000 AND silence_delay <= 30000),
  CONSTRAINT check_retention_days_range CHECK (data_retention_days >= 1 AND data_retention_days <= 365),

  -- Foreign key to companies (optional)
  CONSTRAINT fk_voice_settings_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_voice_settings_user_id ON user_voice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voice_settings_company_id ON user_voice_settings(company_id);

-- =====================================
-- Voice Analytics
-- =====================================
CREATE TABLE IF NOT EXISTS voice_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- TEXT to match auth.users.id
  company_id UUID, -- Can be NULL if user not yet assigned to company
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  accuracy_score DECIMAL(5,2),
  duration_ms INTEGER,
  transcript_length INTEGER,
  command_type VARCHAR(50),
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Add constraints separately
  CONSTRAINT check_accuracy_score CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  CONSTRAINT check_duration_ms CHECK (duration_ms >= 0),

  -- Foreign key to companies (optional)
  CONSTRAINT fk_voice_analytics_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_voice_analytics_user_id ON voice_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_company_id ON voice_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_created_at ON voice_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_event_type ON voice_analytics(event_type);

-- =====================================
-- Voice Notes
-- =====================================
CREATE TABLE IF NOT EXISTS voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- TEXT to match auth.users.id
  company_id UUID, -- References companies.id (can be NULL)
  transcription TEXT,
  audio_url VARCHAR(500),
  audio_size_bytes BIGINT,
  context JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_expiry') THEN
    ALTER TABLE voice_notes ADD CONSTRAINT check_valid_expiry
      CHECK (expires_at IS NULL OR expires_at > created_at);
  END IF;
END $$;

-- Indexes for voice notes
CREATE INDEX IF NOT EXISTS idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_company_id ON voice_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_created_at ON voice_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_notes_expires_at ON voice_notes(expires_at);

-- =====================================
-- Voice Commands
-- =====================================
CREATE TABLE IF NOT EXISTS voice_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- TEXT to match auth.users.id
  company_id UUID, -- References companies.id (can be NULL)
  command_text TEXT NOT NULL,
  command_type VARCHAR(50) NOT NULL,
  action_taken VARCHAR(100),
  parameters JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_execution_time') THEN
    ALTER TABLE voice_commands ADD CONSTRAINT check_execution_time
      CHECK (execution_time_ms >= 0);
  END IF;
END $$;

-- Indexes for voice commands
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_company_id ON voice_commands(company_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created_at ON voice_commands(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_commands_type ON voice_commands(command_type);

-- =====================================
-- Triggers and Functions
-- =====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_voice_settings
DROP TRIGGER IF EXISTS update_user_voice_settings_updated_at ON user_voice_settings;
CREATE TRIGGER update_user_voice_settings_updated_at
  BEFORE UPDATE ON user_voice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- Row Level Security (RLS)
-- =====================================

-- Enable RLS on all tables
ALTER TABLE user_voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own voice settings
DROP POLICY IF EXISTS user_voice_settings_policy ON user_voice_settings;
CREATE POLICY user_voice_settings_policy ON user_voice_settings
  USING (user_id = auth.uid()::text);

-- Policy: Users can only view their own analytics
DROP POLICY IF EXISTS voice_analytics_policy ON voice_analytics;
CREATE POLICY voice_analytics_policy ON voice_analytics
  USING (user_id = auth.uid()::text);

-- Policy: Users can only view their own voice notes
DROP POLICY IF EXISTS voice_notes_policy ON voice_notes;
CREATE POLICY voice_notes_policy ON voice_notes
  USING (user_id = auth.uid()::text);

-- Policy: Users can only view their own voice commands
DROP POLICY IF EXISTS voice_commands_policy ON voice_commands;
CREATE POLICY voice_commands_policy ON voice_commands
  USING (user_id = auth.uid()::text);

-- Admin policies (for company admins to view team analytics)
-- Note: This requires a public.users table with company_id
-- If public.users doesn't exist, create a view to auth.users
DROP VIEW IF EXISTS public_users;
CREATE OR REPLACE VIEW public_users AS
SELECT
  id::text as id,
  email,
  created_at,
  updated_at,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'company_id' as company_id,
  raw_user_meta_data->>'role' as role
FROM auth.users;

-- Now create admin policy
DROP POLICY IF EXISTS voice_analytics_admin_policy ON voice_analytics;
CREATE POLICY voice_analytics_admin_policy ON voice_analytics
  USING (
    EXISTS (
      SELECT 1 FROM public_users
      WHERE public_users.id = auth.uid()::text
      AND public_users.company_id = voice_analytics.company_id::text
      AND public_users.role IN ('manager', 'company_admin', 'super_admin')
    )
  );

-- =====================================
-- Views for Analytics
-- =====================================

-- View: Daily voice usage statistics
CREATE OR REPLACE VIEW voice_daily_stats AS
SELECT
  DATE(va.created_at) as date,
  va.company_id,
  COUNT(*) as total_commands,
  COUNT(CASE WHEN va.success = true THEN 1 END) as successful_commands,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND(COUNT(CASE WHEN va.success = true THEN 1 END) * 100.0 / COUNT(*), 2)
    ELSE 0
  END as success_rate,
  CASE
    WHEN AVG(va.accuracy_score) IS NOT NULL THEN
      ROUND(AVG(va.accuracy_score)::numeric, 2)
    ELSE NULL
  END as avg_accuracy,
  CASE
    WHEN AVG(va.duration_ms) IS NOT NULL THEN
      ROUND(AVG(va.duration_ms)::numeric, 0)
    ELSE NULL
  END as avg_duration_ms,
  COUNT(DISTINCT va.user_id) as active_users
FROM voice_analytics va
GROUP BY DATE(va.created_at), va.company_id
ORDER BY date DESC, va.company_id;

-- View: User voice usage summary
CREATE OR REPLACE VIEW user_voice_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.company_id,
  COALESCE(COUNT(vc.id), 0) as total_commands,
  COALESCE(COUNT(CASE WHEN vc.success = true THEN 1 END), 0) as successful_commands,
  CASE
    WHEN COUNT(vc.id) > 0 THEN
      ROUND(COUNT(CASE WHEN vc.success = true THEN 1 END) * 100.0 / COUNT(vc.id), 2)
    ELSE 0
  END as success_rate,
  MAX(vc.created_at) as last_command_date,
  COALESCE(COUNT(CASE WHEN vc.created_at >= NOW() - INTERVAL '7 days' THEN 1 END), 0) as commands_last_7_days
FROM public_users u
LEFT JOIN voice_commands vc ON u.id = vc.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.company_id
ORDER BY total_commands DESC;

-- View: Top voice commands
CREATE OR REPLACE VIEW voice_top_commands AS
SELECT
  command_type,
  command_text,
  COUNT(*) as usage_count,
  COUNT(CASE WHEN success = true THEN 1 END) as success_count,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2)
    ELSE 0
  END as success_rate
FROM voice_commands
GROUP BY command_type, command_text
ORDER BY usage_count DESC
LIMIT 50;

-- =====================================
-- Sample Data (Optional)
-- =====================================

-- Insert default voice settings for authenticated users (optional)
-- This will only insert for users who have authenticated at least once
/*
INSERT INTO user_voice_settings (user_id, company_id)
SELECT
  au.id::text,
  au.raw_user_meta_data->>'company_id'
FROM auth.users au
WHERE au.id::text NOT IN (SELECT user_id FROM user_voice_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
*/

-- =====================================
-- Cleanup Policies
-- =====================================

-- Function to clean up expired voice notes
CREATE OR REPLACE FUNCTION cleanup_expired_voice_notes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_notes
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-voice-notes', '0 2 * * *', 'SELECT cleanup_expired_voice_notes();');

-- =====================================
-- Comments
-- =====================================

COMMENT ON TABLE user_voice_settings IS 'Stores user preferences for voice interface';
COMMENT ON TABLE voice_analytics IS 'Tracks voice feature usage and performance metrics';
COMMENT ON TABLE voice_notes IS 'Stores voice recordings and transcriptions';
COMMENT ON TABLE voice_commands IS 'Logs all voice commands and their execution results';
COMMENT ON TABLE companies IS 'Company/organization table';

COMMENT ON COLUMN voice_analytics.event_type IS 'Type of voice event: voice_input, voice_command, tts, error';
COMMENT ON COLUMN voice_analytics.command_type IS 'Category: navigation, action, chatbot, unknown';
COMMENT ON COLUMN voice_notes.context IS 'JSON object with entity context (e.g., {"lead_id": "uuid", "task_id": "uuid"})';
COMMENT ON COLUMN voice_commands.action_taken IS 'The actual action executed (e.g., navigate_to_leads)';

-- =====================================
-- Migration Complete
-- =====================================

DO $$
BEGIN
  RAISE NOTICE 'Voice interface database schema created successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - companies (organization table)';
  RAISE NOTICE '  - user_voice_settings (user preferences)';
  RAISE NOTICE '  - voice_analytics (usage metrics)';
  RAISE NOTICE '  - voice_notes (recorded voice memos)';
  RAISE NOTICE '  - voice_commands (command history)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  - public_users (view of auth.users)';
  RAISE NOTICE '  - voice_daily_stats (daily usage stats)';
  RAISE NOTICE '  - user_voice_summary (user activity summary)';
  RAISE NOTICE '  - voice_top_commands (most used commands)';
  RAISE NOTICE '';
  RAISE NOTICE 'Key Points:';
  RAISE NOTICE '  - user_id is TEXT type (compatible with auth.uid())';
  RAISE NOTICE '  - RLS policies use auth.uid()::text';
  RAISE NOTICE '  - company_id is optional (NULL allowed)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test voice features in browser';
  RAISE NOTICE '  2. Backend is already integrated';
  RAISE NOTICE '  3. Frontend is already integrated';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: This migration works with Supabase Auth (auth.users)';
END $$;
