-- =====================================================
-- META WHATSAPP BUSINESS API INTEGRATION
-- =====================================================
-- This migration adds complete WhatsApp Business API support
-- Specifically designed for Meta (Facebook) WhatsApp Business API
-- =====================================================

BEGIN;

-- =====================================================
-- 1. EXTEND INTEGRATION_SETTINGS FOR WHATSAPP
-- =====================================================

-- Update integration_settings to support WhatsApp
ALTER TABLE integration_settings 
  DROP CONSTRAINT IF EXISTS integration_settings_type_check;
  
ALTER TABLE integration_settings 
  ADD CONSTRAINT integration_settings_type_check 
  CHECK (type = ANY (ARRAY['email'::text, 'slack'::text, 'sms'::text, 'webhook'::text, 'whatsapp'::text]));

-- =====================================================
-- 2. CREATE WHATSAPP MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Meta WhatsApp identification
  provider_message_id TEXT, -- wamid from Meta
  whatsapp_id TEXT NOT NULL, -- Phone number with country code (e.g., 919876543210)
  
  -- Message details
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'template', 'interactive', 'reaction', 'sticker')),
  content TEXT, -- Text content or JSON for structured messages
  media_id TEXT, -- Meta media ID
  media_url TEXT, -- Media URL (for downloading)
  media_caption TEXT,
  media_mime_type TEXT,
  media_sha256 TEXT,
  
  -- Context
  lead_id UUID REFERENCES leads(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES user_profiles(id), -- For outbound messages
  
  -- Status tracking (Meta statuses)
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  error_code INTEGER,
  error_message TEXT,
  
  -- Template info (for template messages)
  template_name TEXT,
  template_language TEXT DEFAULT 'en',
  template_params JSONB, -- Array of parameter values
  
  -- Interactive message data
  interactive_type TEXT, -- 'button', 'list'
  interactive_data JSONB,
  
  -- Timestamps from Meta
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Store full webhook payload for debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT whatsapp_messages_company_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_company ON whatsapp_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_id ON whatsapp_messages(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_provider_id ON whatsapp_messages(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- =====================================================
-- 3. CREATE WHATSAPP TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Template identification
  name TEXT NOT NULL, -- Internal template name
  provider_template_name TEXT, -- Template name in Meta (e.g., "hello_world")
  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language TEXT DEFAULT 'en',
  
  -- Template content structure (Meta format)
  header_type TEXT, -- 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'NONE'
  header_content TEXT, -- Text or media URL
  body_text TEXT NOT NULL, -- Main message with {{1}} placeholders
  footer_text TEXT,
  
  -- Buttons (Meta supports up to 3 buttons)
  buttons JSONB, -- Array of button definitions
  -- Example: [{"type": "QUICK_REPLY", "text": "Yes"}, {"type": "PHONE_NUMBER", "text": "Call", "phone_number": "+1234567890"}]
  
  -- Interactive components
  interactive_type TEXT, -- 'BUTTON', 'LIST'
  interactive_data JSONB,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_approval', 'approved', 'rejected', 'paused', 'disabled')),
  provider_status TEXT, -- Status from Meta API
  provider_template_id TEXT, -- Template ID from Meta
  
  -- Approval info
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  
  -- Template variables
  variables JSONB DEFAULT '[]', -- Extractable variables from body_text (e.g., ["name", "product"])
  variable_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT whatsapp_templates_company_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Drop constraint and index if exists, then add it
ALTER TABLE whatsapp_templates 
  DROP CONSTRAINT IF EXISTS unique_whatsapp_template_name_per_company;

DROP INDEX IF EXISTS unique_whatsapp_template_name_per_company;

ALTER TABLE whatsapp_templates 
  ADD CONSTRAINT unique_whatsapp_template_name_per_company UNIQUE(company_id, name, language);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_company ON whatsapp_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_provider_name ON whatsapp_templates(provider_template_name);

-- =====================================================
-- 4. CREATE WHATSAPP CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  whatsapp_id TEXT NOT NULL, -- Phone number
  
  -- Context
  lead_id UUID REFERENCES leads(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  
  -- Conversation metadata
  last_message_at TIMESTAMPTZ,
  last_message_direction TEXT, -- 'inbound' or 'outbound'
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  -- Meta conversation info
  conversation_id TEXT, -- Meta conversation ID
  expiration_timestamp TIMESTAMPTZ, -- 24-hour window expiration
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT whatsapp_conversations_company_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Drop constraint and index if exists, then add it
ALTER TABLE whatsapp_conversations 
  DROP CONSTRAINT IF EXISTS unique_whatsapp_conversation_per_company;

DROP INDEX IF EXISTS unique_whatsapp_conversation_per_company;

ALTER TABLE whatsapp_conversations 
  ADD CONSTRAINT unique_whatsapp_conversation_per_company UNIQUE(company_id, whatsapp_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_company ON whatsapp_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_whatsapp_id ON whatsapp_conversations(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_lead ON whatsapp_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact ON whatsapp_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_active ON whatsapp_conversations(is_active, last_message_at DESC);

-- =====================================================
-- 5. CREATE WHATSAPP SEQUENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Workflow definition (similar to email_sequences)
  json_definition JSONB NOT NULL, -- {steps: [{type, delay, template_id, conditions, actions}]}
  entry_conditions JSONB, -- conditions to auto-enroll leads
  exit_on_reply BOOLEAN DEFAULT true,
  exit_on_goal JSONB,
  
  -- Settings
  is_active BOOLEAN DEFAULT false,
  send_time_window JSONB, -- {start: '09:00', end: '17:00', timezone: 'Asia/Kolkata'}
  max_messages_per_day INTEGER DEFAULT 5, -- WhatsApp has stricter limits
  
  -- Stats
  stats JSONB DEFAULT '{}', -- {enrolled: 0, active: 0, completed: 0, messages_sent: 0}
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop constraint and index if exists, then add it
ALTER TABLE whatsapp_sequences 
  DROP CONSTRAINT IF EXISTS unique_whatsapp_sequence_name;

DROP INDEX IF EXISTS unique_whatsapp_sequence_name;

ALTER TABLE whatsapp_sequences 
  ADD CONSTRAINT unique_whatsapp_sequence_name UNIQUE(company_id, name);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sequences_company ON whatsapp_sequences(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sequences_active ON whatsapp_sequences(is_active);

-- =====================================================
-- 6. CREATE SEQUENCE ENROLLMENTS (for WhatsApp)
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES whatsapp_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  
  -- Progress tracking
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  -- Timing
  next_run_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  enrolled_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop constraint and index if exists, then add it
ALTER TABLE whatsapp_sequence_enrollments 
  DROP CONSTRAINT IF EXISTS unique_whatsapp_enrollment;

DROP INDEX IF EXISTS unique_whatsapp_enrollment;

ALTER TABLE whatsapp_sequence_enrollments 
  ADD CONSTRAINT unique_whatsapp_enrollment UNIQUE(sequence_id, lead_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_enrollments_sequence ON whatsapp_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_enrollments_lead ON whatsapp_sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_enrollments_status ON whatsapp_sequence_enrollments(status, next_run_at);

COMMIT;

