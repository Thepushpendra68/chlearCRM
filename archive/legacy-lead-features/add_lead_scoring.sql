-- =====================================================
-- Lead Scoring System Migration
-- Created: 2025-11-07
-- Description: Adds lead scoring tables and functionality
-- =====================================================

-- Create lead_scores table
-- Stores current score values for each lead
CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    current_score INTEGER NOT NULL DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 100),
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id)
);

-- Create scoring_rules table
-- Stores configurable scoring rules per company
CREATE TABLE IF NOT EXISTS scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('activity', 'field', 'engagement')),
    activity_type TEXT, -- e.g., 'email', 'call', 'email_opened', 'email_clicked'
    field_name TEXT, -- e.g., 'deal_value', 'source', 'status' for field-based rules
    condition_operator TEXT, -- e.g., '>', '<', '=', '>=', '<='
    condition_value TEXT, -- The value to compare against (stored as text for flexibility)
    score_value INTEGER NOT NULL, -- Points to add (positive) or subtract (negative)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_score_events table
-- Audit trail for all score changes
CREATE TABLE IF NOT EXISTS activity_score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    rule_id UUID REFERENCES scoring_rules(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    reason TEXT, -- Human-readable explanation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_company_id ON lead_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_current_score ON lead_scores(current_score);
CREATE INDEX IF NOT EXISTS idx_activity_score_events_lead_id ON activity_score_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_score_events_created_at ON activity_score_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_company_id ON scoring_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_rule_type ON scoring_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_is_active ON scoring_rules(is_active);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_score_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_scores
CREATE POLICY "Users can view lead scores for their company"
    ON lead_scores FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM user_profiles WHERE company_id = lead_scores.company_id
    ));

CREATE POLICY "Users can insert lead scores for their company"
    ON lead_scores FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM user_profiles WHERE company_id = lead_scores.company_id
    ));

CREATE POLICY "Users can update lead scores for their company"
    ON lead_scores FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM user_profiles WHERE company_id = lead_scores.company_id
    ));

-- RLS Policies for scoring_rules
CREATE POLICY "Users can view scoring rules for their company"
    ON scoring_rules FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM user_profiles WHERE company_id = scoring_rules.company_id
    ));

CREATE POLICY "Company admins can manage scoring rules"
    ON scoring_rules FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM user_profiles
            WHERE company_id = scoring_rules.company_id
            AND role IN ('company_admin', 'super_admin', 'manager')
        )
    );

-- RLS Policies for activity_score_events
CREATE POLICY "Users can view score events for their company"
    ON activity_score_events FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM user_profiles WHERE company_id = activity_score_events.company_id
    ));

CREATE POLICY "Users can insert score events for their company"
    ON activity_score_events FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM user_profiles WHERE company_id = activity_score_events.company_id
    ));

-- =====================================================
-- Triggers for updated_at timestamp
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to lead_scores and scoring_rules
CREATE TRIGGER update_lead_scores_updated_at
    BEFORE UPDATE ON lead_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scoring_rules_updated_at
    BEFORE UPDATE ON scoring_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Default Scoring Rules
-- =====================================================

-- These will be created per company during company setup
-- Example default rules (to be inserted per company):
/*
INSERT INTO scoring_rules (company_id, name, description, rule_type, activity_type, score_value, is_active)
VALUES
    (company_uuid, 'Email Opened', 'Points for opening an email', 'activity', 'email_opened', 10, true),
    (company_uuid, 'Email Clicked', 'Points for clicking a link in email', 'activity', 'email_clicked', 15, true),
    (company_uuid, 'Call Completed', 'Points for completing a call', 'activity', 'call', 15, true),
    (company_uuid, 'Meeting Scheduled', 'Points for scheduling a meeting', 'activity', 'meeting', 20, true),
    (company_uuid, 'Form Submitted', 'Points for submitting a form', 'activity', 'form_submit', 25, true),
    (company_uuid, 'High Deal Value', 'Points for high-value deals', 'field', 'deal_value', 20, true),
    (company_uuid, 'No Activity - 7 Days', 'Penalty for no activity', 'engagement', null, -5, true),
    (company_uuid, 'No Activity - 30 Days', 'Penalty for no activity', 'engagement', null, -15, true);
*/

-- =====================================================
-- Function to calculate lead score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_lead_score(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER := 0;
    score_record RECORD;
BEGIN
    -- Initialize with 0
    total_score := 0;

    -- Calculate score based on activity_score_events
    SELECT COALESCE(SUM(points), 0) INTO total_score
    FROM activity_score_events
    WHERE lead_id = p_lead_id;

    -- Ensure score is within bounds (0-100)
    total_score := GREATEST(0, LEAST(100, total_score));

    -- Update or insert the score
    INSERT INTO lead_scores (lead_id, company_id, current_score, last_calculated_at)
    SELECT
        l.id,
        l.company_id,
        total_score,
        NOW()
    FROM leads l
    WHERE l.id = p_lead_id
    ON CONFLICT (lead_id)
    DO UPDATE SET
        current_score = EXCLUDED.current_score,
        last_calculated_at = EXCLUDED.last_calculated_at;

    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to recalculate all scores for a company
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_all_scores(p_company_id UUID)
RETURNS INTEGER AS $$
DECLARE
    lead_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all leads in the company
    FOR lead_record IN
        SELECT id FROM leads WHERE company_id = p_company_id
    LOOP
        PERFORM calculate_lead_score(lead_record.id);
        updated_count := updated_count + 1;
    END LOOP;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Completion message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Lead Scoring system tables created successfully!';
    RAISE NOTICE 'Created tables: lead_scores, scoring_rules, activity_score_events';
    RAISE NOTICE 'Created indexes for performance optimization';
    RAISE NOTICE 'Enabled RLS with company-level security policies';
    RAISE NOTICE 'Created utility functions: calculate_lead_score(), recalculate_all_scores()';
END $$;
