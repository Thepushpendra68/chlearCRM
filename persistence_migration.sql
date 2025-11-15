-- Persistence Layer Migration
-- Creates tables for conversation history and user preferences
-- Includes archival and GDPR compliance features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversation Messages Table
-- Stores all conversation history with metadata
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  tokens_used INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences Table
-- Stores user preferences in a flexible key-value format
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL,
  preference_key VARCHAR(100) NOT NULL,
  preference_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_type, preference_key)
);

-- Archived Messages Table
-- For GDPR compliance and data archival
CREATE TABLE IF NOT EXISTS archived_conversation_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  session_id UUID NOT NULL,
  message_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  tokens_used INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_type ON conversation_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type ON user_preferences(user_id, preference_type);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_messages
-- Users can only see their own messages
CREATE POLICY "Users can view own messages" ON conversation_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON conversation_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON conversation_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON conversation_messages
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
-- Users can only manage their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Company admins can view all company messages (for compliance)
CREATE POLICY "Company admins can view company messages" ON conversation_messages
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Company admins can view all company preferences (for compliance)
CREATE POLICY "Company admins can view company preferences" ON user_preferences
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Functions for archival and GDPR compliance

-- Function to archive old messages
CREATE OR REPLACE FUNCTION archive_conversation_messages(
  p_user_id UUID,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old messages to archived table
  INSERT INTO archived_conversation_messages
  SELECT * FROM conversation_messages
  WHERE user_id = p_user_id
    AND created_at < p_cutoff_date;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Delete from original table
  DELETE FROM conversation_messages
  WHERE user_id = p_user_id
    AND created_at < p_cutoff_date;

  RETURN archived_count;
END;
$$;

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION get_user_storage_stats(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'messageCount', (
      SELECT COUNT(*) FROM conversation_messages
      WHERE user_id = p_user_id
    ),
    'totalSizeBytes', (
      SELECT COALESCE(SUM(LENGTH(content)), 0)
      FROM conversation_messages
      WHERE user_id = p_user_id
    ),
    'oldestMessage', (
      SELECT MIN(created_at) FROM conversation_messages
      WHERE user_id = p_user_id
    ),
    'newestMessage', (
      SELECT MAX(created_at) FROM conversation_messages
      WHERE user_id = p_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Function for GDPR data export
CREATE OR REPLACE FUNCTION export_user_data(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'messages', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'sessionId', session_id,
          'type', message_type,
          'content', content,
          'metadata', metadata,
          'tokensUsed', tokens_used,
          'modelUsed', model_used,
          'createdAt', created_at
        )
      )
      FROM conversation_messages
      WHERE user_id = p_user_id
      ORDER BY created_at
    ),
    'preferences', (
      SELECT json_agg(
        json_build_object(
          'type', preference_type,
          'key', preference_key,
          'value', preference_value,
          'updatedAt', updated_at
        )
      )
      FROM user_preferences
      WHERE user_id = p_user_id
      ORDER BY preference_type, preference_key
    ),
    'exportDate', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_messages_updated_at
  BEFORE UPDATE ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Views for easy querying

-- User conversation summary view
CREATE OR REPLACE VIEW user_conversation_summary AS
SELECT
  user_id,
  session_id,
  COUNT(*) as message_count,
  MIN(created_at) as started_at,
  MAX(created_at) as last_activity,
  SUM(CASE WHEN message_type = 'user' THEN 1 ELSE 0 END) as user_messages,
  SUM(CASE WHEN message_type = 'assistant' THEN 1 ELSE 0 END) as assistant_messages
FROM conversation_messages
GROUP BY user_id, session_id;

-- User preferences summary view
CREATE OR REPLACE VIEW user_preferences_summary AS
SELECT
  user_id,
  preference_type,
  COUNT(*) as preference_count,
  MIN(updated_at) as first_set,
  MAX(updated_at) as last_updated
FROM user_preferences
GROUP BY user_id, preference_type;

-- Cleanup old archived messages (run monthly)
CREATE OR REPLACE FUNCTION cleanup_archived_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete archived messages older than 1 year
  DELETE FROM archived_conversation_messages
  WHERE archived_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversation_messages TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT SELECT ON user_conversation_summary TO authenticated;
GRANT SELECT ON user_preferences_summary TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION archive_conversation_messages(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_storage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_archived_messages() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE conversation_messages IS 'Stores all conversation messages with metadata';
COMMENT ON TABLE user_preferences IS 'Stores user preferences in flexible key-value format';
COMMENT ON TABLE archived_conversation_messages IS 'Archived messages for GDPR compliance';
COMMENT ON FUNCTION archive_conversation_messages IS 'Archives messages older than cutoff date';
COMMENT ON FUNCTION get_user_storage_stats IS 'Returns storage usage statistics for a user';
COMMENT ON FUNCTION export_user_data IS 'Exports all user data for GDPR compliance';
COMMENT ON FUNCTION cleanup_archived_messages IS 'Removes archived messages older than 1 year';
