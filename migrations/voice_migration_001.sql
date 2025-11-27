-- Voice Interface Database Schema
-- Migration: Create voice-related tables for CHLEAR CRM
-- Date: November 13, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- User Voice Settings
-- =====================================
CREATE TABLE user_voice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en-US',
  auto_speak BOOLEAN DEFAULT true,
  voice_activation BOOLEAN DEFAULT false,
  wake_word VARCHAR(50) DEFAULT 'Hey Sakha',
  rate DECIMAL(3,1) DEFAULT 1.0 CHECK (rate >= 0.5 AND rate <= 2.0),
  pitch DECIMAL(3,1) DEFAULT 1.0 CHECK (pitch >= 0.5 AND pitch <= 2.0),
  volume DECIMAL(3,1) DEFAULT 1.0 CHECK (volume >= 0.0 AND volume <= 1.0),
  silence_delay INTEGER DEFAULT 5000 CHECK (silence_delay >= 1000 AND silence_delay <= 30000),
  store_voice_notes BOOLEAN DEFAULT true,
  allow_voice_analytics BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 30 CHECK (data_retention_days >= 1 AND data_retention_days <= 365),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one setting per user
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_voice_settings_user_id ON user_voice_settings(user_id);

-- =====================================
-- Voice Analytics
-- =====================================
CREATE TABLE voice_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  accuracy_score DECIMAL(5,2) CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  duration_ms INTEGER CHECK (duration_ms >= 0),
  transcript_length INTEGER,
  command_type VARCHAR(50), -- 'navigation', 'action', 'chatbot', 'unknown'
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Partition by month for better performance (optional)
  -- PARTITION BY RANGE (created_at)
);

-- Indexes for analytics queries
CREATE INDEX idx_voice_analytics_user_id ON voice_analytics(user_id);
CREATE INDEX idx_voice_analytics_company_id ON voice_analytics(company_id);
CREATE INDEX idx_voice_analytics_created_at ON voice_analytics(created_at);
CREATE INDEX idx_voice_analytics_event_type ON voice_analytics(event_type);

-- =====================================
-- Voice Notes
-- =====================================
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transcription TEXT,
  audio_url VARCHAR(500),
  audio_size_bytes BIGINT,
  context JSONB, -- Store related entity info (lead_id, task_id, etc.)
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For data retention

  -- Add expires_at trigger
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for voice notes
CREATE INDEX idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX idx_voice_notes_company_id ON voice_notes(company_id);
CREATE INDEX idx_voice_notes_created_at ON voice_notes(created_at);
CREATE INDEX idx_voice_notes_expires_at ON voice_notes(expires_at);

-- =====================================
-- Voice Commands
-- =====================================
CREATE TABLE voice_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  command_text TEXT NOT NULL,
  command_type VARCHAR(50) NOT NULL, -- 'navigation', 'action', 'chatbot'
  action_taken VARCHAR(100), -- What action was executed
  parameters JSONB, -- Parameters passed to the action
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for voice commands
CREATE INDEX idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX idx_voice_commands_company_id ON voice_commands(company_id);
CREATE INDEX idx_voice_commands_created_at ON voice_commands(created_at);
CREATE INDEX idx_voice_commands_type ON voice_commands(command_type);

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
CREATE POLICY user_voice_settings_policy ON user_voice_settings
  USING (user_id = auth.uid());

-- Policy: Users can only view their own analytics
CREATE POLICY voice_analytics_policy ON voice_analytics
  USING (user_id = auth.uid());

-- Policy: Users can only view their own voice notes
CREATE POLICY voice_notes_policy ON voice_notes
  USING (user_id = auth.uid());

-- Policy: Users can only view their own voice commands
CREATE POLICY voice_commands_policy ON voice_commands
  USING (user_id = auth.uid());

-- Admin policies (for company admins to view team analytics)
CREATE POLICY voice_analytics_admin_policy ON voice_analytics
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = voice_analytics.company_id
      AND users.role IN ('manager', 'company_admin', 'super_admin')
    )
  );

-- =====================================
-- Views for Analytics
-- =====================================

-- View: Daily voice usage statistics
CREATE VIEW voice_daily_stats AS
SELECT
  DATE(created_at) as date,
  company_id,
  COUNT(*) as total_commands,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_commands,
  ROUND(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate,
  AVG(accuracy_score) as avg_accuracy,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(DISTINCT user_id) as active_users
FROM voice_analytics
GROUP BY DATE(created_at), company_id
ORDER BY date DESC, company_id;

-- View: User voice usage summary
CREATE VIEW user_voice_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.company_id,
  COUNT(vc.id) as total_commands,
  COUNT(CASE WHEN vc.success = true THEN 1 END) as successful_commands,
  ROUND(COUNT(CASE WHEN vc.success = true THEN 1 END) * 100.0 / COUNT(vc.id), 2) as success_rate,
  MAX(vc.created_at) as last_command_date,
  COUNT(CASE WHEN vc.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as commands_last_7_days
FROM users u
LEFT JOIN voice_commands vc ON u.id = vc.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.company_id
ORDER BY total_commands DESC;

-- View: Top voice commands
CREATE VIEW voice_top_commands AS
SELECT
  command_type,
  command_text,
  COUNT(*) as usage_count,
  COUNT(CASE WHEN success = true THEN 1 END) as success_count,
  ROUND(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM voice_commands
GROUP BY command_type, command_text
ORDER BY usage_count DESC
LIMIT 50;

-- =====================================
-- Sample Data (Optional)
-- =====================================

-- Insert default voice settings for existing users (optional)
-- Uncomment if you want to auto-provision settings
/*
INSERT INTO user_voice_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_voice_settings);
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

-- Schedule cleanup (using pg_cron extension if available)
-- SELECT cron.schedule('cleanup-voice-notes', '0 2 * * *', 'SELECT cleanup_expired_voice_notes();');

-- =====================================
-- Comments
-- =====================================

COMMENT ON TABLE user_voice_settings IS 'Stores user preferences for voice interface';
COMMENT ON TABLE voice_analytics IS 'Tracks voice feature usage and performance metrics';
COMMENT ON TABLE voice_notes IS 'Stores voice recordings and transcriptions';
COMMENT ON TABLE voice_commands IS 'Logs all voice commands and their execution results';

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
  RAISE NOTICE '  - user_voice_settings (user preferences)';
  RAISE NOTICE '  - voice_analytics (usage metrics)';
  RAISE NOTICE '  - voice_notes (recorded voice memos)';
  RAISE NOTICE '  - voice_commands (command history)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  - voice_daily_stats (daily usage stats)';
  RAISE NOTICE '  - user_voice_summary (user activity summary)';
  RAISE NOTICE '  - voice_top_commands (most used commands)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run backend voice service queries to fetch/update settings';
  RAISE NOTICE '  2. Implement analytics logging in voice endpoints';
  RAISE NOTICE '  3. Set up automated cleanup for expired voice notes';
END $$;
