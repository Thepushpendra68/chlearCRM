-- =====================================================
-- Migration: 20250107_migrate_leads_to_contacts.sql
-- Purpose: Backfill contacts and lead associations from legacy lead data
-- =====================================================

BEGIN;

WITH lead_source AS (
  SELECT
    l.id AS lead_id,
    l.company_id,
    l.account_id,
    NULLIF(l.first_name, '') AS first_name,
    NULLIF(l.last_name, '') AS last_name,
    LOWER(NULLIF(l.email, '')) AS email,
    NULLIF(l.phone, '') AS phone,
    NULL AS mobile_phone,
    NULLIF(l.title, '') AS title,
    l.created_by,
    COALESCE(l.created_at, NOW()) AS created_at,
    COALESCE(l.updated_at, NOW()) AS updated_at
  FROM leads l
  WHERE (COALESCE(l.email, '') <> '')
     OR (COALESCE(l.phone, '') <> '')
),
inserted_email_contacts AS (
  INSERT INTO contacts (
    company_id,
    account_id,
    first_name,
    last_name,
    email,
    phone,
    mobile_phone,
    title,
    status,
    is_primary,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    ls.company_id,
    ls.account_id,
    ls.first_name,
    ls.last_name,
    ls.email,
    ls.phone,
    ls.mobile_phone,
    ls.title,
    'active',
    false,
    ls.created_by,
    ls.created_at,
    ls.updated_at
  FROM lead_source ls
  WHERE ls.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM contacts c
      WHERE c.company_id = ls.company_id
        AND c.email = ls.email
    )
  RETURNING id, company_id, email
),
inserted_phone_contacts AS (
  INSERT INTO contacts (
    company_id,
    account_id,
    first_name,
    last_name,
    email,
    phone,
    mobile_phone,
    title,
    status,
    is_primary,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    ls.company_id,
    ls.account_id,
    ls.first_name,
    ls.last_name,
    NULL,
    ls.phone,
    ls.mobile_phone,
    ls.title,
    'active',
    false,
    ls.created_by,
    ls.created_at,
    ls.updated_at
  FROM lead_source ls
  WHERE ls.email IS NULL
    AND ls.phone IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM contacts c
      WHERE c.company_id = ls.company_id
        AND (
          ls.phone IS NOT NULL AND c.phone = ls.phone
        )
    )
  RETURNING id, company_id, phone, mobile_phone
)

-- Step 2: Link leads to matching contacts
INSERT INTO lead_contacts (
  lead_id,
  contact_id,
  company_id,
  is_primary,
  role,
  created_by,
  created_at
)
SELECT
  l.id,
  c.id,
  l.company_id,
  true,
  NULL,
  l.created_by,
  NOW()
FROM leads l
JOIN contacts c
  ON c.company_id = l.company_id
 AND (
      (l.email IS NOT NULL AND c.email = LOWER(l.email))
   OR (l.phone IS NOT NULL AND c.phone = l.phone)
 )
LEFT JOIN lead_contacts existing
  ON existing.lead_id = l.id
 AND existing.contact_id = c.id
WHERE existing.id IS NULL;

COMMIT;

-- Note: This script is idempotent. Re-running will not duplicate contacts or lead associations.
