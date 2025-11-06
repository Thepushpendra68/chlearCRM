# Repository Guidelines

## Project Structure & Module Organization
This monorepo separates concerns by runtime. `backend/src` houses the Express API with parallel folders for `controllers`, `services`, `routes`, `middleware`, `validators`, and `config/supabase.js`; seed helpers live in `backend/scripts/`. `frontend/src` contains the Vite React app, split into `components`, `pages`, `context`, `services`, and `test`. Serverless endpoints for Vercel reside under `api/index.js`, while operational references (SQL, deployment checklists) are curated in `docs/`. Generated assets in `dist/` are read-only.

**Key Components:**
- `frontend/src/components/Layout/Sidebar.jsx` - Main navigation sidebar with role-based access
- `frontend/src/components/Layout/Layout.jsx` - Application layout wrapper
- `frontend/src/pages/` - Page components for each module (Dashboard, Leads, Pipeline, etc.)
- `frontend/src/components/` - Reusable UI components by feature
- `frontend/src/services/` - API service modules for each feature area

## Application Navigation Overview

### Sidebar Structure
The CRM features a collapsible sidebar navigation with **15 main features** organized in two sections:

**Main Navigation (Top):**
1. Dashboard - Overview with metrics
2. Leads - Lead management (badge count)
3. Pipeline - Kanban board view
4. Activities - Activity tracking (badge count)
5. Email Templates - Template management
6. Email Sequences - Automation builder
7. Email Analytics - Campaign metrics

**Utility Navigation (Bottom):**
8. Assignments - Lead assignment rules
9. Tasks - Task management (badge count)
10. Users - User administration
11. Reports - Analytics & reports
12. Custom Fields - (Manager+)
13. API Clients - (Company Admin+)
14. Email Settings - (Company Admin+)
15. Platform Admin - (Super Admin only)

**Badge Counts:** Real-time counts from `/api/dashboard/badge-counts` for Leads, Activities, and Tasks.

**Role Hierarchy:** `super_admin > company_admin > manager > sales_rep` (descending permissions)

## Tech Stack

### Backend Stack (backend/package.json)
- **Core**: Express.js, @supabase/supabase-js, Supabase (PostgreSQL + Auth + Real-time + RLS)
- **AI**: @google/generative-ai (Gemini AI) with model fallback chain
- **Auth**: jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, express-validator
- **Email**: postmark, mjml, handlebars, juice, html-minifier, sanitize-html
- **Data**: csv-parser, xlsx, multer (file uploads)
- **Scheduler**: node-cron (email sequences)
- **Utils**: date-fns, uuid, fuse.js (fuzzy search), zod, validator, bottleneck, p-retry

### Frontend Stack (frontend/package.json)
- **Core**: React 18, Vite, React Router v6
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **UI**: @headlessui/react, @heroicons/react, lucide-react, @radix-ui/*, CVA, clsx, tailwind-merge
- **Forms/State**: React Hook Form, @tanstack/react-query, React Hot Toast
- **API**: Axios, @supabase/supabase-js
- **Advanced**: @monaco-editor/react, React Flow, GrapesJS (email builder), @vercel/analytics
- **Testing**: Vitest, @testing-library/react, ESLint

### Backend Route Architecture
**18 route modules** (`backend/src/routes/`) with **150+ endpoints**:

1. **authRoutes.js** (7) - Authentication & registration
2. **leadRoutes.js** (11) - Lead management with search & filtering
3. **pipelineRoutes.js** (8) - Pipeline stages & conversion rates
4. **activityRoutes.js** (13) - Activity tracking & timelines
5. **taskRoutes.js** (5) - Task management
6. **assignmentRoutes.js** (15) - Lead assignment automation
7. **emailRoutes.js** (25+) - Email templates, sequences, sending, webhooks
8. **dashboardRoutes.js** (8) - Dashboard metrics & badge counts
9. **customFieldRoutes.js** (9) - Custom field management
10. **apiClientRoutes.js** (8) - API client management
11. **userRoutes.js** - User administration
12. **reportRoutes.js** (3+) - Reporting system
13. **importRoutes.js** (7) - CSV/Excel import/export
14. **chatbotRoutes.js** (3) - AI chatbot (Gemini AI)
15. **platformRoutes.js** - Platform administration (Super Admin)
16. **leadCaptureRoutes.js** (3) - Public API for lead capture
17. **picklistRoutes.js** - Picklist management
18. **configRoutes.js** (5) - System configuration

### API Features
- Role-based access control on all endpoints
- Pagination on all list endpoints
- Fuzzy search using fuse.js
- Bulk operations (leads, activities)
- File upload with multer
- Real-time updates via Supabase
- Centralized error handling
- Express-rate-limit rate limiting

## Build, Test, and Development Commands
Use Node 18+.
- `npm run build` (root) installs frontend deps and writes the production bundle to `frontend/dist`.
- `cd backend && npm install && npm run dev` runs the API with nodemon on port 5000 (`npm start` for plain Node).
- `cd frontend && npm install && npm run dev` starts Vite dev server; `npm run build` and `npm run preview` validate production output.
Supabase data resets should rely on the SQL in `supabase_schema.sql` or `docs/` rather than deprecated migration scripts.

## Coding Style & Naming Conventions
- **Frontend:** Two-space indentation, ES modules, camelCase for variables/functions, PascalCase for React components
- **Backend:** Arrow functions for controller methods to maintain `this` binding (critical for Import/Export methods)
- **Files:** Descriptive names matching feature (`LeadForm.jsx`, `leadService.js`, `leadController.js`)
- **Routes:** RESTful API endpoints under `/api/<resource>` structure

## Testing Guidelines
Backend suites use Jest and Supertest; co-locate new specs beside the code they cover (e.g. `backend/src/controllers/leadController.test.js`) and execute with `npm test` or `npm run test:watch`. Frontend tests use Vitest with Testing Library in `frontend/src/test`; run `npm run test` for watch mode or `npm run test:run` in CI. Prioritize role-based scenarios and Supabase edge cases, and document high-risk regressions in `docs/` when automation cannot cover them.

## Common Navigation Tasks

### Adding a New Navigation Item
1. **Frontend Route:** Add to `mainNavigation` or `utilityNavigation` array in `frontend/src/components/Layout/Sidebar.jsx`
2. **Page Component:** Create in `frontend/src/pages/<FeatureName>.jsx`
3. **Backend API:** Create controller + routes in `backend/src/controllers/` and `backend/src/routes/`
4. **Role Permissions:** Add conditional rendering based on user role
5. **Badge Count:** Update `/api/dashboard/badge-counts` endpoint if needed

### Sidebar Customization
- **Collapse/Expand:** Toggle via `isCollapsed` state (Ctrl+B shortcut)
- **Badge Display:** Real-time updates every 5 minutes
- **Role Visibility:** Use conditional rendering: `(user?.role === 'manager' || user?.role === 'super_admin')`
- **Mobile Support:** Automatic handling via `Dialog` component for mobile overlay

## Commit & Pull Request Guidelines
Match the existing uppercase commit prefixes (`FEATURE:`, `FIX:`, `CHORE:`) and keep subjects under 72 characters in imperative mood. PRs should provide a concise summary, linked issue or ticket, and proof of passing tests or linting. UI-facing changes need before/after screenshots or a Vite preview link, and any schema or env updates must include accompanying SQL or documentation changes.

## Deployment & Infrastructure
**Production URL**: https://chlear-crm.vercel.app

### Current Production Setup
- **Frontend**: Deployed on Vercel
- **Backend**: Deployed as Vercel Serverless Function (`api/index.js`)
- **Database**: Supabase (PostgreSQL + Auth + Real-time + RLS)
- **Build Tools**: Vite tools in `dependencies` (not devDependencies) for Vercel

### Environment Variables
**Frontend (.env)**:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend (.env)**:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

## Environment & Configuration Notes
`.env.example` in `backend/` and `frontend/` list required keys; copy them locally but never commit secrets. Configure Supabase, JWT, and Gemini credentials through environment variables or Vercel project settings. Keep fallback toggles (e.g. `CHATBOT_FALLBACK_ONLY`, rate limits) conservative in shared deployments and call out temporary overrides in the PR description to aid release owners.
