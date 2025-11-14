-- =====================================================
-- EMAIL TEMPLATES AND AUTOMATION SYSTEM
-- =====================================================
-- This migration adds complete email template management
-- and workflow automation capabilities to the CRM
-- =====================================================

BEGIN;

-- =====================================================
-- 1. INTEGRATION SETTINGS (Email Provider Config)
-- =====================================================

CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'slack', 'sms', 'webhook')),
  provider TEXT NOT NULL, -- 'postmark', 'sendgrid', 'ses', etc.
  config JSONB NOT NULL, -- api_key, from_email, domain, webhook_secret, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, type, provider)
);

CREATE INDEX idx_integration_settings_company ON integration_settings(company_id);
CREATE INDEX idx_integration_settings_type ON integration_settings(type);

-- =====================================================
-- 2. EMAIL TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  folder TEXT DEFAULT 'general',
  category TEXT, -- 'welcome', 'follow-up', 'nurture', 'notification', etc.
  is_active BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false, -- shared templates across company
  tags TEXT[], -- for searching/filtering
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_template_name_per_company UNIQUE(company_id, name)
);

CREATE INDEX idx_email_templates_company ON email_templates(company_id);
CREATE INDEX idx_email_templates_folder ON email_templates(folder);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_tags ON email_templates USING GIN(tags);

-- =====================================================
-- 3. EMAIL TEMPLATE VERSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  editor_type TEXT NOT NULL CHECK (editor_type IN ('code', 'dragdrop', 'html')),
  subject TEXT NOT NULL,
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,

  -- Content storage
  mjml TEXT, -- raw MJML (for code editor)
  html TEXT NOT NULL, -- compiled HTML (ready to send)
  text_version TEXT, -- plain text fallback
  json_design JSONB, -- drag-drop design JSON (GrapesJS/Unlayer)

  -- Merge variables
  variables JSONB DEFAULT '[]', -- discovered merge vars: [{name, type, required}]

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Preview
  preview_data JSONB DEFAULT '{}', -- sample data for preview

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_version_per_template UNIQUE(template_id, version_number)
);

CREATE INDEX idx_template_versions_template ON email_template_versions(template_id);
CREATE INDEX idx_template_versions_published ON email_template_versions(is_published);

-- =====================================================
-- 4. OUTBOUND MESSAGES (Email Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS outbound_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_version_id UUID REFERENCES email_template_versions(id) ON DELETE SET NULL,

  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Content
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text_version TEXT,

  -- Provider details
  provider TEXT, -- 'postmark', 'sendgrid', etc.
  provider_message_id TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued', -- queued|sending|sent|delivered|bounced|failed
  error_message TEXT,

  -- Metrics
  metrics JSONB DEFAULT '{}', -- {sent_at, delivered_at, opened_at, clicked_at, bounced_at, opened_count, clicked_count, links_clicked: []}

  -- Metadata
  sequence_id UUID, -- if sent as part of sequence
  enrollment_id UUID, -- specific enrollment
  automation_rule_id UUID, -- if triggered by rule
  context JSONB DEFAULT '{}', -- additional context

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbound_messages_company ON outbound_messages(company_id);
CREATE INDEX idx_outbound_messages_lead ON outbound_messages(lead_id);
CREATE INDEX idx_outbound_messages_template ON outbound_messages(template_id);
CREATE INDEX idx_outbound_messages_status ON outbound_messages(status);
CREATE INDEX idx_outbound_messages_provider_id ON outbound_messages(provider_message_id);
CREATE INDEX idx_outbound_messages_created ON outbound_messages(created_at DESC);

-- =====================================================
-- 5. EMAIL SEQUENCES (Automation Workflows)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Workflow definition
  json_definition JSONB NOT NULL, -- {steps: [{type, delay, template_id, conditions, actions}]}

  -- Entry conditions
  entry_conditions JSONB, -- conditions to auto-enroll leads

  -- Exit rules
  exit_on_reply BOOLEAN DEFAULT true,
  exit_on_goal JSONB, -- e.g., {type: 'stage_change', stage_id: '...'}

  -- Settings
  is_active BOOLEAN DEFAULT false,
  send_time_window JSONB, -- {start: '09:00', end: '17:00', timezone: 'America/New_York'}
  max_emails_per_day INTEGER DEFAULT 3,

  -- Stats
  stats JSONB DEFAULT '{}', -- {enrolled: 0, active: 0, completed: 0, emails_sent: 0}

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_sequence_name_per_company UNIQUE(company_id, name)
);

CREATE INDEX idx_email_sequences_company ON email_sequences(company_id);
CREATE INDEX idx_email_sequences_active ON email_sequences(is_active);

-- =====================================================
-- 6. SEQUENCE ENROLLMENTS (Lead in Sequence)
-- =====================================================

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active|paused|completed|exited|failed

  -- Progress
  current_step INTEGER DEFAULT 0,
  next_run_at TIMESTAMPTZ,

  -- Tracking
  steps_completed INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMPTZ,

  -- Exit info
  exit_reason TEXT, -- 'replied', 'goal_met', 'manual', 'unsubscribed', 'bounced'
  exited_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- variables, custom data

  enrolled_by UUID REFERENCES user_profiles(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_lead_sequence_enrollment UNIQUE(sequence_id, lead_id)
);

CREATE INDEX idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_lead ON sequence_enrollments(lead_id);
CREATE INDEX idx_sequence_enrollments_status ON sequence_enrollments(status);
CREATE INDEX idx_sequence_enrollments_next_run ON sequence_enrollments(next_run_at) WHERE status = 'active';

-- =====================================================
-- 7. AUTOMATION RULES (Trigger-based Actions)
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger configuration
  trigger JSONB NOT NULL, -- {type: 'lead_created'|'stage_changed'|'field_updated'|'inactivity', config: {...}}

  -- Conditions to check before executing
  conditions JSONB, -- [{field, operator, value}, ...] with AND/OR logic

  -- Actions to execute
  actions JSONB NOT NULL, -- [{type: 'send_email'|'enroll_sequence'|'update_field'|'create_task', config: {...}}]

  -- Settings
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10, -- execution order (higher = first)
  run_once_per_lead BOOLEAN DEFAULT false,

  -- Limits
  max_runs_per_day INTEGER,

  -- Stats
  stats JSONB DEFAULT '{}', -- {total_runs, successful_runs, failed_runs, last_run_at}

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_company ON automation_rules(company_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX idx_automation_rules_priority ON automation_rules(priority DESC);

-- =====================================================
-- 8. AUTOMATION RUNS (Execution Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'pending', -- pending|running|completed|failed
  trigger_data JSONB, -- snapshot of trigger event
  conditions_met BOOLEAN,
  actions_executed JSONB DEFAULT '[]', -- [{action, status, result}]

  -- Result
  error_message TEXT,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_automation_runs_rule ON automation_runs(automation_rule_id);
CREATE INDEX idx_automation_runs_company ON automation_runs(company_id);
CREATE INDEX idx_automation_runs_lead ON automation_runs(lead_id);
CREATE INDEX idx_automation_runs_started ON automation_runs(started_at DESC);

-- =====================================================
-- 9. EMAIL SUPPRESSION LIST (Unsubscribe, Bounces)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_suppression_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Reason
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribed', 'bounced', 'spam_complaint', 'manual')),

  -- Details
  source TEXT, -- 'user_request', 'webhook', 'admin'
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_suppressed_email_per_company UNIQUE(company_id, email)
);

CREATE INDEX idx_email_suppression_company ON email_suppression_list(company_id);
CREATE INDEX idx_email_suppression_email ON email_suppression_list(email);
CREATE INDEX idx_email_suppression_reason ON email_suppression_list(reason);

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Integration Settings
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_settings_select" ON integration_settings
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "integration_settings_insert" ON integration_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'super_admin')
  );

CREATE POLICY "integration_settings_update" ON integration_settings
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'super_admin')
  );

-- Email Templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_select" ON email_templates
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "email_templates_insert" ON email_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
  );

CREATE POLICY "email_templates_update" ON email_templates
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
  );

CREATE POLICY "email_templates_delete" ON email_templates
  FOR DELETE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'super_admin')
  );

-- Template Versions
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_versions_select" ON email_template_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_templates et
      WHERE et.id = email_template_versions.template_id
      AND public.user_belongs_to_company(et.company_id)
    )
  );

CREATE POLICY "template_versions_insert" ON email_template_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_templates et
      WHERE et.id = email_template_versions.template_id
      AND public.user_belongs_to_company(et.company_id)
      AND public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
    )
  );

-- Outbound Messages
ALTER TABLE outbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outbound_messages_select" ON outbound_messages
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "outbound_messages_insert" ON outbound_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

-- Email Sequences
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_sequences_select" ON email_sequences
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "email_sequences_insert" ON email_sequences
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
  );

CREATE POLICY "email_sequences_update" ON email_sequences
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
  );

CREATE POLICY "email_sequences_delete" ON email_sequences
  FOR DELETE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'super_admin')
  );

-- Sequence Enrollments
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sequence_enrollments_select" ON sequence_enrollments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_sequences es
      WHERE es.id = sequence_enrollments.sequence_id
      AND public.user_belongs_to_company(es.company_id)
    )
  );

CREATE POLICY "sequence_enrollments_insert" ON sequence_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_sequences es
      WHERE es.id = sequence_enrollments.sequence_id
      AND public.user_belongs_to_company(es.company_id)
    )
  );

-- Automation Rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_select" ON automation_rules
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "automation_rules_insert" ON automation_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
  );

CREATE POLICY "automation_rules_update" ON automation_rules
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('company_admin', 'manager', 'super_admin')
  );

-- Suppression List
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppression_list_select" ON email_suppression_list
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY "suppression_list_insert" ON email_suppression_list
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'integration_settings',
  'email_templates',
  'email_template_versions',
  'outbound_messages',
  'email_sequences',
  'sequence_enrollments',
  'automation_rules',
  'automation_runs',
  'email_suppression_list'
)
ORDER BY table_name;

