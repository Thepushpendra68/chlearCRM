-- =====================================================
-- WORKFLOW LIBRARY SYSTEM
-- =====================================================
-- This migration adds workflow template library functionality
-- for reusable automation sequences and industry-specific packs
-- =====================================================

BEGIN;

-- =====================================================
-- 1. WORKFLOW TEMPLATES (User-created reusable templates)
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = system/global template
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template definition (same structure as email_sequences.json_definition)
  json_definition JSONB NOT NULL,
  
  -- Template metadata
  category TEXT, -- 'welcome', 'nurture', 'follow-up', 'onboarding', 're-engagement', etc.
  industry TEXT, -- 'general', 'real_estate', 'education', 'healthcare', 'saas', etc.
  tags TEXT[], -- For searchability
  
  -- Template settings snapshot
  entry_conditions JSONB,
  exit_on_reply BOOLEAN DEFAULT true,
  exit_on_goal JSONB,
  send_time_window JSONB,
  max_emails_per_day INTEGER DEFAULT 3,
  
  -- Visibility
  is_public BOOLEAN DEFAULT false, -- Can be shared across companies
  is_active BOOLEAN DEFAULT true,
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0, -- How many times used
  last_used_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
);
-- Use a unique index for (company_id, name); avoid named constraint collisions
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_templates_company_name ON workflow_templates(company_id, name);

CREATE INDEX idx_workflow_templates_company ON workflow_templates(company_id);
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_industry ON workflow_templates(industry);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_workflow_templates_active ON workflow_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_workflow_templates_tags ON workflow_templates USING GIN(tags);

-- =====================================================
-- 2. WORKFLOW TEMPLATE PACKS (Industry-specific collections)
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_template_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  industry TEXT NOT NULL, -- 'real_estate', 'education', 'healthcare', 'saas', etc.
  
  -- Pack metadata
  icon_url TEXT,
  preview_image_url TEXT,
  tags TEXT[],
  
  -- Templates included in this pack
  template_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Pack stats
  download_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_template_packs_industry ON workflow_template_packs(industry);
CREATE INDEX idx_workflow_template_packs_active ON workflow_template_packs(is_active) WHERE is_active = true;

-- =====================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Workflow Templates: Users can see their company's templates + public templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company templates"
  ON workflow_templates FOR SELECT
  USING (
    company_id = current_setting('app.current_company_id')::UUID
    OR is_public = true
  );

CREATE POLICY "Users can create company templates"
  ON workflow_templates FOR INSERT
  WITH CHECK (
    company_id = current_setting('app.current_company_id')::UUID
  );

CREATE POLICY "Users can update company templates"
  ON workflow_templates FOR UPDATE
  USING (
    company_id = current_setting('app.current_company_id')::UUID
  );

CREATE POLICY "Users can delete company templates"
  ON workflow_templates FOR DELETE
  USING (
    company_id = current_setting('app.current_company_id')::UUID
  );

-- Template Packs: Public read-only
ALTER TABLE workflow_template_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active template packs"
  ON workflow_template_packs FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 4. SEED DATA: Default Workflow Templates
-- =====================================================

-- Welcome Sequence Template
INSERT INTO workflow_templates (id, company_id, name, description, json_definition, category, industry, tags, is_public, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL, -- System template
  'Welcome Sequence',
  'A 3-step welcome sequence for new customers. Introduces your company, highlights key features, and encourages engagement.',
  '{
    "steps": [
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Welcome to {{company.name}}!",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 2}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Getting Started with {{company.name}}",
        "conditions": []
      }
    ]
  }'::jsonb,
  'welcome',
  'general',
  ARRAY['welcome', 'onboarding', 'new-customer'],
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Lead Nurture Template
INSERT INTO workflow_templates (id, company_id, name, description, json_definition, category, industry, tags, is_public, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'Lead Nurture Sequence',
  'A 5-step nurture sequence to build relationships with prospects. Provides value, educates, and moves leads through the funnel.',
  '{
    "steps": [
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Thanks for your interest in {{company.name}}",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 3}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "How {{company.name}} helps businesses like yours",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 5}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Ready to see {{company.name}} in action?",
        "conditions": []
      }
    ]
  }'::jsonb,
  'nurture',
  'general',
  ARRAY['nurture', 'prospect', 'lead-nurturing'],
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Demo Booking Template
INSERT INTO workflow_templates (id, company_id, name, description, json_definition, category, industry, tags, is_public, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'Demo Booking Sequence',
  'A focused sequence to encourage prospects to book a demo. Includes value propositions and clear CTAs.',
  '{
    "steps": [
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Schedule a personalized demo with {{company.name}}",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 2}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "See how {{company.name}} can transform your workflow",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 3}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Last chance to book your demo",
        "conditions": []
      }
    ]
  }'::jsonb,
  'demo',
  'general',
  ARRAY['demo', 'booking', 'sales'],
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Abandoned Cart Template (for e-commerce/SaaS)
INSERT INTO workflow_templates (id, company_id, name, description, json_definition, category, industry, tags, is_public, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  NULL,
  'Abandoned Cart Recovery',
  'Recover abandoned carts or incomplete signups with a 3-step sequence. Reminds users what they left behind.',
  '{
    "steps": [
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 1},
        "template_id": null,
        "subject": "You left something in your cart",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 1}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Complete your purchase - Special offer inside!",
        "conditions": []
      },
      {
        "type": "wait",
        "delay": {"unit": "days", "value": 2}
      },
      {
        "type": "send_email",
        "delay": {"unit": "hours", "value": 0},
        "template_id": null,
        "subject": "Final reminder: Your items are waiting",
        "conditions": []
      }
    ]
  }'::jsonb,
  'recovery',
  'general',
  ARRAY['cart', 'recovery', 'abandoned', 'ecommerce'],
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. SEED DATA: Industry Template Packs
-- =====================================================

-- Real Estate Pack
INSERT INTO workflow_template_packs (id, name, description, industry, tags, template_ids, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'Real Estate Agent Pack',
  'Complete automation templates for real estate professionals. Includes lead nurturing, property alerts, and follow-up sequences.',
  'real_estate',
  ARRAY['real-estate', 'property', 'agent', 'sales'],
  ARRAY[]::UUID[],
  true
) ON CONFLICT (id) DO NOTHING;

-- Education Pack
INSERT INTO workflow_template_packs (id, name, description, industry, tags, template_ids, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000102',
  'Education Institution Pack',
  'Automation templates for schools, universities, and training programs. Includes enrollment sequences, course reminders, and student engagement.',
  'education',
  ARRAY['education', 'school', 'university', 'student'],
  ARRAY[]::UUID[],
  true
) ON CONFLICT (id) DO NOTHING;

-- Healthcare Pack
INSERT INTO workflow_template_packs (id, name, description, industry, tags, template_ids, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000103',
  'Healthcare Provider Pack',
  'HIPAA-aware automation templates for healthcare. Includes appointment reminders, patient follow-ups, and wellness campaigns.',
  'healthcare',
  ARRAY['healthcare', 'medical', 'patient', 'appointment'],
  ARRAY[]::UUID[],
  true
) ON CONFLICT (id) DO NOTHING;

COMMIT;

