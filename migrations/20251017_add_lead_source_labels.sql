-- Add picklist labels for lead sources to support fuzzy matching
-- This allows Instagram → social_media, Walk-In → event, etc.

-- Insert or update picklist options with labels
INSERT INTO lead_picklist_options (type, value, label, is_active, sort_order, created_at)
VALUES
  -- Social media sources
  ('source', 'social_media', 'Instagram', true, 1, now()),
  ('source', 'social_media', 'Facebook', true, 2, now()),
  ('source', 'social_media', 'LinkedIn', true, 3, now()),
  ('source', 'social_media', 'Twitter', true, 4, now()),
  ('source', 'social_media', 'TikTok', true, 5, now()),
  
  -- Event sources
  ('source', 'event', 'Walk-In', true, 1, now()),
  ('source', 'event', 'Trade Show', true, 2, now()),
  ('source', 'event', 'Conference', true, 3, now()),
  ('source', 'event', 'Webinar', true, 4, now()),
  
  -- Call sources
  ('source', 'cold_call', 'Phone', true, 1, now()),
  ('source', 'cold_call', 'Inbound Call', true, 2, now()),
  
  -- Referral variations
  ('source', 'referral', 'Word of Mouth', true, 1, now()),
  ('source', 'referral', 'Referral', true, 2, now()),
  
  -- Website
  ('source', 'website', 'Web', true, 1, now()),
  ('source', 'website', 'Website Form', true, 2, now()),
  
  -- Email
  ('source', 'email', 'Email Campaign', true, 1, now()),
  ('source', 'email', 'Newsletter', true, 2, now()),
  
  -- Advertisement
  ('source', 'advertisement', 'Google Ads', true, 1, now()),
  ('source', 'advertisement', 'Facebook Ads', true, 2, now()),
  ('source', 'advertisement', 'Ad Campaign', true, 3, now()),
  
  -- Status labels for better matching
  ('status', 'new', 'New Lead', true, 1, now()),
  ('status', 'contacted', 'Contacted', true, 2, now()),
  ('status', 'lost', 'Closed Lost', true, 1, now()),
  ('status', 'lost', 'Lost Deal', true, 2, now())
ON CONFLICT (type, value) DO NOTHING;

-- Index for faster picklist lookups during import
CREATE INDEX IF NOT EXISTS idx_lead_picklist_options_type_value 
ON lead_picklist_options(type, value) 
WHERE is_active = true;
