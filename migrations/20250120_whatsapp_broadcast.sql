-- =====================================================
-- WHATSAPP BROADCAST CAPABILITIES
-- =====================================================
-- This migration adds broadcast/bulk messaging support
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE WHATSAPP BROADCASTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Broadcast details
  name TEXT NOT NULL,
  description TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'template', 'media')),
  
  -- Message content
  content TEXT, -- For text messages
  template_name TEXT, -- For template messages
  template_language TEXT DEFAULT 'en',
  template_params JSONB, -- Template parameters
  
  -- Media (for media broadcasts)
  media_type TEXT, -- 'image', 'video', 'audio', 'document'
  media_url TEXT,
  media_caption TEXT,
  
  -- Recipients
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('leads', 'contacts', 'custom', 'filter')),
  recipient_ids JSONB, -- Array of lead/contact IDs for 'custom' type
  recipient_filters JSONB, -- Filter criteria for 'filter' type (e.g., {status: 'new', source: 'website'})
  recipient_count INTEGER DEFAULT 0, -- Total recipients
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ, -- NULL = send immediately
  send_time_window JSONB, -- {start: '09:00', end: '17:00', timezone: 'Asia/Kolkata'}
  
  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed')),
  progress JSONB DEFAULT '{"sent": 0, "delivered": 0, "read": 0, "failed": 0}', -- Real-time progress
  
  -- Rate limiting
  messages_per_minute INTEGER DEFAULT 10, -- WhatsApp rate limit compliance
  batch_size INTEGER DEFAULT 10, -- Messages per batch
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT whatsapp_broadcasts_company_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_broadcasts_company ON whatsapp_broadcasts(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_broadcasts_status ON whatsapp_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_broadcasts_scheduled ON whatsapp_broadcasts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_broadcasts_created ON whatsapp_broadcasts(created_at DESC);

-- =====================================================
-- 2. CREATE WHATSAPP BROADCAST RECIPIENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES whatsapp_broadcasts(id) ON DELETE CASCADE,
  
  -- Recipient identification
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  whatsapp_id TEXT NOT NULL, -- Phone number
  
  -- Message tracking
  message_id UUID REFERENCES whatsapp_messages(id), -- Link to actual sent message
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  
  -- Error tracking
  error_code INTEGER,
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT whatsapp_broadcast_recipients_broadcast_fkey FOREIGN KEY (broadcast_id) REFERENCES whatsapp_broadcasts(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON whatsapp_broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_lead ON whatsapp_broadcast_recipients(lead_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_contact ON whatsapp_broadcast_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_status ON whatsapp_broadcast_recipients(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_whatsapp_id ON whatsapp_broadcast_recipients(whatsapp_id);

-- Unique constraint: one recipient per broadcast
ALTER TABLE whatsapp_broadcast_recipients 
  DROP CONSTRAINT IF EXISTS unique_broadcast_recipient;

ALTER TABLE whatsapp_broadcast_recipients 
  ADD CONSTRAINT unique_broadcast_recipient UNIQUE(broadcast_id, whatsapp_id);

COMMIT;

