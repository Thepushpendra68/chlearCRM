# User Management Enhancements

## Overview

The `/app/users` workspace now behaves like a production-grade admin console. The page is backed by the REST API (`GET /api/users`) instead of a client-side Supabase query and introduces richer controls for discovering and governing accounts.

## Frontend Highlights

- Debounced search, role and status filters, sortable headers, and pagination all funnel into a single query payload so the server owns filtering logic.
- Inline action menu offers edit, deactivate/reactivate, and resend-invite flows with guard rails (self-deactivation is blocked and actions surface toast feedback).
- Create/Edit modal relies on `react-hook-form`, provides a secure password generator, enforces role eligibility based on the current admin, and keeps status toggles within the modal.
- New hook `frontend/src/hooks/useDebounce.js` centralises throttled state for search inputs and can be reused by other pages.
- Skeleton placeholders, empty states, and button focus states improve perceived performance and accessibility.

## Backend Updates

- Validators now understand the current role vocabulary (`sales_rep`, `manager`, `company_admin`, `super_admin`).
- `POST /api/users/:id/resend-invite` triggers Supabase's admin invite flow and requires the caller to be a company or super admin.
- The service layer centralises invite resends via `resendUserInvite`, reusing the existing profile lookup to respect company isolation.
- `.env.example` documents the optional `APP_URL` variable used when crafting invite redirect URLs.

## Verification

1. **Backend tests** – `cd backend && npm test` (ensures service/controller surface area still passes existing suites).
2. **Frontend lint/tests** – `cd ../frontend && npm run lint && npm run test -- --watch=false`.
3. **Manual smoke** – from an admin session, confirm table filters, invite resend, create/edit, and deactivate/reactivate flows.

## Follow-Ups

- Wire audit logging for user mutations (actor, verb, metadata) once the audit table ships.
- Extend invite flow to support custom welcome messages and track delivery status.
- Consider surfacing verification state (email confirmed vs. pending) once Supabase exposes it in the `user_profiles_with_auth` view.
