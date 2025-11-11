-- =====================================================
-- SECONDARY PLATFORM FEATURES (PHASE 2)
-- =====================================================
-- Run after 20251112_001_primary_core_schema.sql.
-- This script layers on advanced/optional platform features:
-- custom fields, automation, scoring, marketing/email, imports,
-- API clients, chatbot, workflows, and audit logging.
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Additional enums for custom-field engine
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custom_field_entity_type') THEN
    CREATE TYPE custom_field_entity_type AS ENUM (
      'lead',
      'contact',
      'company',
      'deal',
      'task',
      'activity'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custom_field_data_type') THEN
    CREATE TYPE custom_field_data_type AS ENUM (
      'text',
      'textarea',
      'number',
      'decimal',
      'boolean',
      'date',
      'datetime',
      'select',
      'multiselect',
      'email',
      'phone',
      'url',
      'currency'
    );
  END IF;
END$$;

-- -----------------------------------------------------
-- Custom field metadata
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_description text,
  entity_type custom_field_entity_type NOT NULL,
  data_type custom_field_data_type NOT NULL,
  is_required boolean DEFAULT false,
  is_unique boolean DEFAULT false,
  is_searchable boolean DEFAULT true,
  field_options jsonb DEFAULT '[]'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  display_order integer DEFAULT 0,
  placeholder text,
  help_text text,
  default_value text,
  is_active boolean DEFAULT true,
  is_system_field boolean DEFAULT false,
  created_by uuid REFERENCES public.user_profiles(id),
  updated_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, entity_type, field_name)
);

CREATE TABLE IF NOT EXISTS public.custom_field_audit (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  custom_field_id uuid REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action = ANY (ARRAY['created','updated','deleted','activated','deactivated'])),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES public.user_profiles(id),
  changed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_company ON public.custom_field_definitions(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON public.custom_field_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_field_audit_company ON public.custom_field_audit(company_id);

-- -----------------------------------------------------
-- Lead assignment & scoring
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignment_round_robin_state (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  last_assigned_at timestamptz DEFAULT now(),
  assignment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.lead_assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  assignment_type text NOT NULL DEFAULT 'round_robin',
  assigned_to uuid REFERENCES public.user_profiles(id),
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_assignment_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  previous_assigned_to uuid REFERENCES public.user_profiles(id),
  new_assigned_to uuid REFERENCES public.user_profiles(id),
  assigned_by uuid REFERENCES public.user_profiles(id),
  assignment_reason text,
  assignment_source text CHECK (assignment_source = ANY (ARRAY['manual','auto','rule'])),
  assignment_rule_id uuid REFERENCES public.lead_assignment_rules(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL CHECK (rule_type = ANY (ARRAY['activity','field','engagement'])),
  activity_type text,
  field_name text,
  condition_operator text,
  condition_value text,
  score_value integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  current_score integer NOT NULL DEFAULT 0 CHECK (current_score BETWEEN 0 AND 100),
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.scoring_rules(id),
  points integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------
-- Automation & workflows
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger jsonb NOT NULL,
  conditions jsonb,
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 10,
  run_once_per_lead boolean DEFAULT false,
  max_runs_per_day integer,
  stats jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id),
  status text NOT NULL DEFAULT 'pending',
  trigger_data jsonb,
  conditions_met boolean,
  actions_executed jsonb DEFAULT '[]'::jsonb,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  json_definition jsonb NOT NULL,
  category text,
  industry text,
  tags text[],
  entry_conditions jsonb,
  exit_on_reply boolean DEFAULT true,
  exit_on_goal jsonb,
  send_time_window jsonb,
  max_emails_per_day integer DEFAULT 3,
  is_public boolean DEFAULT false,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_template_packs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  industry text NOT NULL,
  icon_url text,
  preview_image_url text,
  tags text[],
  template_ids uuid[] DEFAULT ARRAY[]::uuid[],
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['system','user','assistant'])),
  content text NOT NULL,
  tool_calls jsonb DEFAULT '[]'::jsonb,
  tool_results jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------
-- Email & outbound comms
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  folder text DEFAULT 'general',
  category text,
  is_active boolean DEFAULT true,
  is_shared boolean DEFAULT false,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_template_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  editor_type text NOT NULL CHECK (editor_type = ANY (ARRAY['code','dragdrop','html'])),
  subject text NOT NULL,
  from_name text,
  from_email text,
  reply_to text,
  mjml text,
  html text NOT NULL,
  text_version text,
  json_design jsonb,
  variables jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  preview_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  json_definition jsonb NOT NULL,
  entry_conditions jsonb,
  exit_on_reply boolean DEFAULT true,
  exit_on_goal jsonb,
  is_active boolean DEFAULT false,
  send_time_window jsonb,
  max_emails_per_day integer DEFAULT 3,
  stats jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  current_step integer DEFAULT 0,
  next_run_at timestamptz,
  steps_completed integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  last_email_sent_at timestamptz,
  exit_reason text,
  exited_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  enrolled_by uuid REFERENCES public.user_profiles(id),
  enrolled_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outbound_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.email_templates(id),
  template_version_id uuid REFERENCES public.email_template_versions(id),
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  html text NOT NULL,
  text_version text,
  provider text,
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  metrics jsonb DEFAULT '{}'::jsonb,
  sequence_id uuid REFERENCES public.email_sequences(id),
  enrollment_id uuid REFERENCES public.sequence_enrollments(id),
  automation_rule_id uuid REFERENCES public.automation_rules(id),
  context jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_suppression_list (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['unsubscribed','bounced','spam_complaint','manual'])),
  source text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (company_id, email)
);

-- -----------------------------------------------------
-- API clients & integrations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  api_key text NOT NULL UNIQUE,
  api_secret_hash text NOT NULL,
  is_active boolean DEFAULT true,
  rate_limit integer DEFAULT 100,
  allowed_origins text[],
  webhook_url text,
  custom_field_mapping jsonb DEFAULT '{}'::jsonb,
  default_lead_source text DEFAULT 'api',
  default_assigned_to uuid REFERENCES public.user_profiles(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  last_used_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_client_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id uuid NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  request_body jsonb,
  error_message text,
  lead_id uuid REFERENCES public.leads(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type = ANY (ARRAY['email','slack','sms','webhook'])),
  provider text NOT NULL,
  config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------
-- Imports & telemetry
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  duplicate_policy_default text NOT NULL DEFAULT 'skip',
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES public.user_profiles(id),
  updated_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_mappings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  mapping_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  updated_by uuid REFERENCES public.user_profiles(id),
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  filename text NOT NULL,
  total_records integer DEFAULT 0,
  successful_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  status text DEFAULT 'processing',
  error_details jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  mode text NOT NULL DEFAULT 'apply',
  duplicate_policy text,
  config_version integer,
  validation_errors jsonb,
  validation_warnings jsonb,
  summary jsonb,
  error_report_url text
);

CREATE TABLE IF NOT EXISTS public.import_telemetry (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.user_profiles(id),
  phase text NOT NULL CHECK (phase = ANY (ARRAY['dry_run','import'])),
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  duplicate_policy text,
  config_version integer,
  duration_ms integer,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Auditing & suppression
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES public.user_profiles(id),
  actor_email text NOT NULL,
  actor_role user_role NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  is_impersonation boolean DEFAULT false,
  impersonated_user_id uuid,
  severity text DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------
-- Row-Level Security enablement
-- -----------------------------------------------------
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_round_robin_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_template_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Policies (generalized)
-- -----------------------------------------------------
CREATE POLICY IF NOT EXISTS custom_field_definitions_rw ON public.custom_field_definitions
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS custom_field_audit_select ON public.custom_field_audit
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS assignment_round_robin_policy ON public.assignment_round_robin_state
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS lead_assignment_rules_policy ON public.lead_assignment_rules
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS lead_assignment_history_select ON public.lead_assignment_history
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company((SELECT company_id FROM public.leads WHERE id = lead_id)));

CREATE POLICY IF NOT EXISTS scoring_rules_policy ON public.scoring_rules
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS lead_scores_policy ON public.lead_scores
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS activity_score_events_select ON public.activity_score_events
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS automation_rules_policy ON public.automation_rules
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS automation_runs_select ON public.automation_runs
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS workflow_templates_policy ON public.workflow_templates
  FOR ALL TO authenticated
  USING (company_id IS NULL OR public.user_belongs_to_company(company_id))
  WITH CHECK (company_id IS NULL OR public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS workflow_template_packs_policy ON public.workflow_template_packs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS chatbot_conversations_policy ON public.chatbot_conversations
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS email_templates_policy ON public.email_templates
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS email_template_versions_policy ON public.email_template_versions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_templates et
    WHERE et.id = template_id AND public.user_belongs_to_company(et.company_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_templates et
    WHERE et.id = template_id AND public.user_belongs_to_company(et.company_id)
  ));

CREATE POLICY IF NOT EXISTS email_sequences_policy ON public.email_sequences
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS sequence_enrollments_policy ON public.sequence_enrollments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_sequences es
    WHERE es.id = sequence_id AND public.user_belongs_to_company(es.company_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_sequences es
    WHERE es.id = sequence_id AND public.user_belongs_to_company(es.company_id)
  ));

CREATE POLICY IF NOT EXISTS outbound_messages_select ON public.outbound_messages
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS outbound_messages_insert ON public.outbound_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS email_suppression_policy ON public.email_suppression_list
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS api_clients_policy ON public.api_clients
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS api_client_requests_select ON public.api_client_requests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_clients ac
    WHERE ac.id = api_client_id AND public.user_belongs_to_company(ac.company_id)
  ));

CREATE POLICY IF NOT EXISTS integration_settings_policy ON public.integration_settings
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS import_configs_policy ON public.import_configs
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS import_mappings_policy ON public.import_mappings
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS import_history_policy ON public.import_history
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS import_telemetry_policy ON public.import_telemetry
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    actor_id = public.user_id() OR
    public.get_user_role() IN ('super_admin','company_admin','manager')
  );

COMMIT;

-- =====================================================
-- END SECONDARY PLATFORM FEATURES
-- =====================================================
