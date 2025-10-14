-- Ensure lead emails are unique per company while allowing cross-company duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_company_email_unique
ON public.leads (company_id, lower(email))
WHERE email IS NOT NULL;
