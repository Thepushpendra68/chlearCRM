# Leads Data Model Notes

- Lead records are scoped to the company of the authenticated user.
- Email addresses are normalized to lowercase on write.
- Emails must be unique within a company, but the same person can exist as a lead under different companies. A composite index on `(company_id, lower(email))` enforces this rule.
- Imports run the same per-company uniqueness check so that batches surface duplicate-row errors instead of failing at insert time.
