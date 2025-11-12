# CHLEAR CRM (Sakha) - Comprehensive Feature Documentation

## Overview
**Sakha** is a full-stack, multi-tenant CRM system built with:
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js REST API
- **Database**: Supabase (PostgreSQL) with Auth, RLS, and Real-time
- **AI Integration**: Google Gemini AI with fallback chain
- **Email System**: Postmark + MJML + Handlebars
- **Deployment**: Vercel + Supabase Cloud

---

## I. AUTHENTICATION & USER MANAGEMENT

### Routes: `authRoutes.js`, `userRoutes.js`, `supabaseAuthRoutes.js`

**Features:**
- **User Registration & Authentication**
  - POST `/api/auth/register` - Register new user
  - POST `/api/auth/register-company` - Register company with admin (Supabase)
  - POST `/api/auth/login` - User login
  - POST `/api/auth/logout` - Logout user
  - GET `/api/auth/me` - Get current user profile
  - PUT `/api/auth/profile` - Update user profile
  - PUT `/api/auth/change-password` - Change password

- **User Administration** (Company Admin/Super Admin)
  - GET `/api/users` - List all users
  - POST `/api/users` - Create new user
  - GET `/api/users/:id` - Get user by ID
  - PUT `/api/users/:id` - Update user
  - DELETE `/api/users/:id` - Deactivate user
  - POST `/api/users/:id/resend-invite` - Resend invitation

- **Role-Based Access Control**
  - **super_admin**: Platform-wide administration
  - **company_admin**: Company-level administration
  - **manager**: Team management capabilities
  - **sales_rep**: Standard user access

**Implementation:**
- Supabase Auth with JWT token validation
- Role-based route protection via middleware
- Multi-tenant architecture with company-based data isolation

---

## II. LEAD MANAGEMENT

### Routes: `leadRoutes.js`, `scoringRoutes.js`, `leadCaptureRoutes.js`

**Core Capabilities:**
- **CRUD Operations**
  - GET `/api/leads` - List leads with pagination, filtering, search
  - GET `/api/leads/:id` - Get lead by ID
  - POST `/api/leads` - Create new lead
  - PUT `/api/leads/:id` - Update lead
  - DELETE `/api/leads/:id` - Delete lead
  - PUT `/api/leads/:id/move-stage` - Move to pipeline stage

- **Advanced Features**
  - GET `/api/leads/stats` - Lead statistics
  - GET `/api/leads/search` - Search leads
  - **Bulk Operations** via import system
  - **Lead Scoring**
    - GET `/api/leads/:id/score` - Get lead score
    - GET `/api/leads/:id/score-breakdown` - Score breakdown and history
    - POST `/api/leads/:id/calculate-score` - Calculate score

- **Lead Scoring Rules** (Manager+)
  - GET `/api/scoring/rules` - List scoring rules
  - POST `/api/scoring/rules` - Create scoring rule
  - PUT `/api/scoring/rules/:id` - Update scoring rule
  - DELETE `/api/scoring/rules/:id` - Delete scoring rule
  - POST `/api/scoring/recalculate` - Recalculate all scores

- **Public API** (Lead Capture)
  - POST `/api/v1/capture/lead` - Single lead capture
  - POST `/api/v1/capture/leads/bulk` - Bulk lead capture
  - GET `/api/v1/capture/info` - API client info

**Filtering & Search:**
- Status, source, assigned user filters
- Date range filters
- Deal value range
- Text search (name, email, company)
- Pagination support

**Lead Fields:**
- Identity: name, first_name, last_name, email, phone
- Company: company, title (job_title)
- Sales: status, source, deal_value, expected_close_date
- Assignment: assigned_to, pipeline_stage_id
- Tracking: notes, priority, created_at, updated_at
- **Custom Fields Support**: Dynamic custom fields via JSONB

---

## III. PIPELINE MANAGEMENT

### Routes: `pipelineRoutes.js`

**Features:**
- **Pipeline Stage Management**
  - GET `/api/pipeline/stages` - List all stages
  - POST `/api/pipeline/stages` - Create stage
  - PUT `/api/pipeline/stages/:id` - Update stage
  - DELETE `/api/pipeline/stages/:id` - Delete stage
  - PUT `/api/pipeline/stages/reorder` - Reorder stages
  - POST `/api/pipeline/create-default-stages` - Create default stages

- **Pipeline Analytics**
  - GET `/api/pipeline/overview` - Pipeline overview
  - GET `/api/pipeline/conversion-rates` - Conversion rate analysis

**Implementation:**
- Kanban board UI with drag-and-drop
- Visual lead progression through stages
- Real-time updates via Supabase subscriptions

---

## IV. CONTACT MANAGEMENT

### Routes: `contactRoutes.js`

**Features:**
- **Contact CRUD**
  - GET `/api/contacts` - List contacts with pagination
  - GET `/api/contacts/:id` - Get contact by ID
  - POST `/api/contacts` - Create contact
  - PUT `/api/contacts/:id` - Update contact
  - DELETE `/api/contacts/:id` - Delete contact

- **Contact Features**
  - GET `/api/contacts/stats` - Contact statistics
  - POST `/api/contacts/duplicates` - Find duplicates
  - POST `/api/contacts/:id/leads/:leadId` - Link to lead
  - DELETE `/api/contacts/:id/leads/:leadId` - Unlink from lead

**Contact Fields:**
- Identity: first_name, last_name, email, phone, mobile_phone
- Professional: title, department
- Social: linkedin_url, twitter_handle
- Preferences: preferred_contact_method, do_not_call, do_not_email
- Address: JSONB address field
- Relationship: is_primary, is_decision_maker, reporting_to
- Lifecycle: lifecycle_stage (lead, marketing_qualified, sales_qualified, etc.)

---

## V. ACCOUNT MANAGEMENT

### Routes: `accountRoutes.js`

**Features:**
- **Account CRUD**
  - GET `/api/accounts` - List accounts with pagination
  - GET `/api/accounts/:id` - Get account by ID
  - POST `/api/accounts` - Create account
  - PUT `/api/accounts/:id` - Update account
  - DELETE `/api/accounts` - Delete account

- **Account Analytics**
  - GET `/api/accounts/:id/leads` - Get account leads
  - GET `/api/accounts/:id/stats` - Account statistics
  - GET `/api/accounts/:id/timeline` - Account timeline

**Relationships:**
- Many contacts per account
- Many leads per account
- Linked activities and tasks

---

## VI. ACTIVITY MANAGEMENT

### Routes: `activityRoutes.js`

**Features:**
- **Activity CRUD**
  - GET `/api/activities` - List activities
  - GET `/api/activities/:id` - Get activity by ID
  - POST `/api/activities` - Create activity
  - POST `/api/activities/bulk` - Bulk create activities
  - PUT `/api/activities/:id` - Update activity
  - PUT `/api/activities/:id/complete` - Complete activity
  - DELETE `/api/activities/:id` - Delete activity

- **Activity Analytics**
  - GET `/api/activities/stats` - Activity statistics
  - GET `/api/activities/trends` - Activity trends

- **Timeline Views**
  - GET `/api/activities/leads/:id/timeline` - Lead timeline
  - GET `/api/activities/leads/:id/timeline/summary` - Timeline summary
  - GET `/api/activities/leads/:id/activities` - Lead activities
  - GET `/api/activities/users/:id/activities` - User activities
  - GET `/api/activities/users/:id/timeline` - User timeline
  - GET `/api/activities/team/timeline` - Team timeline

**Activity Types:**
- Call, email, meeting, task, note
- Custom activity types
- Linked to leads, contacts, accounts

---

## VII. TASK MANAGEMENT

### Routes: `taskRoutes.js`

**Features:**
- **Task CRUD**
  - GET `/api/tasks` - List tasks
  - GET `/api/tasks/:id` - Get task by ID
  - POST `/api/tasks` - Create task
  - PUT `/api/tasks/:id` - Update task
  - PUT `/api/tasks/:id/complete` - Complete task
  - DELETE `/api/tasks/:id` - Delete task

- **Task Features**
  - GET `/api/tasks/stats` - Task statistics
  - GET `/api/tasks/overdue` - Get overdue tasks
  - GET `/api/tasks/lead/:leadId` - Tasks for specific lead

**Task Fields:**
- Title, description, due_date, priority
- Status (pending, in_progress, completed, cancelled)
- Assigned to user
- Linked to leads/contacts/accounts

---

## VIII. EMAIL SYSTEM

### Routes: `emailRoutes.js`, `emailTemplateController.js`, `emailSendController.js`

**Features:**

- **Email Templates**
  - GET `/api/email/templates` - List templates
  - GET `/api/email/templates/:id` - Get template
  - POST `/api/email/templates` - Create template (Manager+)
  - PUT `/api/email/templates/:id` - Update template (Manager+)
  - DELETE `/api/email/templates/:id` - Delete template (Admin)

  - **Template Versions**
    - POST `/api/email/templates/:id/versions` - Create version
    - POST `/api/email/templates/versions/:versionId/publish` - Publish version
    - POST `/api/email/templates/versions/:versionId/preview` - Preview template

  - **Template Folders**
    - GET `/api/email/templates/folders` - List folders

  - **MJML Compilation**
    - POST `/api/email/templates/compile-mjml` - Compile MJML to HTML

- **Email Sending**
  - POST `/api/email/send/lead` - Send to lead
  - POST `/api/email/send/custom` - Send to custom email
  - GET `/api/email/sent` - List sent emails
  - GET `/api/email/sent/:id` - Get email details

- **Suppression List**
  - GET `/api/email/suppression` - Get suppression list
  - POST `/api/email/suppression` - Add to suppression
  - DELETE `/api/email/suppression/:email` - Remove from suppression

- **Email Integration**
  - GET `/api/email/settings/integration` - Get integration settings
  - POST `/api/email/settings/integration` - Update integration settings

- **Webhooks** (Postmark/SendGrid)
  - POST `/api/email/webhooks/postmark` - Postmark webhook
  - POST `/api/email/webhooks/sendgrid` - SendGrid webhook
  - GET `/api/email/webhooks/test` - Test webhook

**Implementation:**
- MJML template engine with Handlebars
- Postmark for email delivery
- Email analytics and tracking
- Template version management

---

## IX. EMAIL AUTOMATION & SEQUENCES

### Routes: `automationController.js`

**Features:**
- **Sequences**
  - GET `/api/email/sequences` - List sequences
  - GET `/api/email/sequences/:id` - Get sequence details
  - POST `/api/email/sequences` - Create sequence (Manager+)
  - PUT `/api/email/sequences/:id` - Update sequence (Manager+)
  - DELETE `/api/email/sequences/:id` - Delete sequence (Admin)

- **Enrollments**
  - POST `/api/email/sequences/:id/enroll` - Enroll lead
  - POST `/api/enrollments/:enrollmentId/unenroll` - Unenroll lead
  - GET `/api/email/sequences/:id/enrollments` - List enrollments

- **Automation Processing**
  - POST `/api/email/process` - Process due enrollments (cron)

**Implementation:**
- Node-cron for scheduled processing
- Automated email sequences
- Lead enrollment system

---

## X. ASSIGNMENT SYSTEM

### Routes: `assignmentRoutes.js`

**Features:**
- **Assignment Rules**
  - GET `/api/assignments/rules` - List rules
  - GET `/api/assignments/rules/active` - Get active rules
  - GET `/api/assignments/rules/:id` - Get rule by ID
  - POST `/api/assignments/rules` - Create rule
  - PUT `/api/assignments/rules/:id` - Update rule
  - DELETE `/api/assignments/rules/:id` - Delete rule

- **Lead Assignment**
  - POST `/api/assignments/leads/:leadId/assign` - Assign lead
  - POST `/api/assignments/leads/bulk-assign` - Bulk assign
  - POST `/api/assignments/leads/:leadId/auto-assign` - Auto-assign
  - POST `/api/assignments/leads/:leadId/reassign` - Reassign
  - GET `/api/assignments/leads/:leadId/assignment-history` - Assignment history
  - GET `/api/assignments/leads/:leadId/recommendations` - Get recommendations

- **Team Management**
  - GET `/api/assignments/workload` - Team workload
  - GET `/api/assignments/history` - Assignment history
  - POST `/api/assignments/redistribute` - Redistribute leads

- **Bulk Operations**
  - POST `/api/assignments/leads/bulk-auto-assign` - Process bulk auto-assignment

- **Analytics**
  - GET `/api/assignments/stats` - Assignment statistics
  - GET `/api/assignments/routing-stats` - Routing statistics

**Implementation:**
- Rule-based assignment engine
- Round-robin and workload-based distribution
- Bulk assignment operations
- Assignment history tracking

---

## XI. CUSTOM FIELDS

### Routes: `customFieldRoutes.js`

**Features:**
- **Custom Field Management**
  - GET `/api/custom-fields` - List custom fields
  - GET `/api/custom-fields/:id` - Get field by ID
  - POST `/api/custom-fields` - Create field (Manager+)
  - PUT `/api/custom-fields/:id` - Update field (Manager+)
  - DELETE `/api/custom-fields/:id` - Delete field (Admin)

- **Field Operations**
  - GET `/api/custom-fields/usage/all` - Usage statistics
  - POST `/api/custom-fields/reorder` - Reorder fields (Manager+)
  - POST `/api/custom-fields/validate` - Validate fields
  - GET `/api/custom-fields/:id/usage` - Field usage statistics

**Field Types:**
- text, textarea, number, decimal, boolean
- date, datetime, email, phone, url, currency
- select, multiselect

**Supported Entities:**
- leads, contacts, companies, deals, tasks, activities

---

## XII. REPORTS & ANALYTICS

### Routes: `reportRoutes.js`

**Features:**
- **Standard Reports**
  - GET `/api/reports/lead-performance` - Lead performance
  - GET `/api/reports/conversion-funnel` - Conversion funnel
  - GET `/api/reports/activity-summary` - Activity summary
  - GET `/api/reports/team-performance` - Team performance
  - GET `/api/reports/pipeline-health` - Pipeline health

- **Custom Reports**
  - POST `/api/reports/custom` - Generate custom report

- **Export**
  - POST `/api/reports/export/:type` - Export report

- **Scheduled Reports**
  - GET `/api/reports/scheduled` - List scheduled reports
  - POST `/api/reports/schedule` - Schedule report

- **Configuration**
  - GET `/api/reports/templates` - Report templates
  - GET `/api/reports/options` - Report options

**Implementation:**
- Reusable report templates
- Export to CSV/Excel
- Scheduled report delivery

---

## XIII. IMPORT/EXPORT SYSTEM

### Routes: `importRoutes.js`

**Features:**
- **Import**
  - POST `/api/import/leads` - Import leads from CSV/Excel
  - POST `/api/import/leads/dry-run` - Preview import data
  - POST `/api/import/validate` - Validate import file
  - POST `/api/import/headers` - Extract file headers
  - GET `/api/import/template` - Download import template
  - GET `/api/import/history` - Import history

**Supported Formats:**
- CSV (via csv-parser)
- Excel (via xlsx library)

**Features:**
- Data validation
- Error reporting
- Import history tracking
- Bulk operations

---

## XIV. DASHBOARD

### Routes: `dashboardRoutes.js`

**Features:**
- **Statistics**
  - GET `/api/dashboard/stats` - Dashboard statistics
  - GET `/api/dashboard/user-performance` - User performance (Admin)

- **Data Views**
  - GET `/api/dashboard/recent-leads` - Recent leads
  - GET `/api/dashboard/lead-trends` - Lead trends
  - GET `/api/dashboard/lead-sources` - Lead source distribution
  - GET `/api/dashboard/lead-status` - Lead status distribution

- **Notifications**
  - GET `/api/dashboard/badge-counts` - Sidebar badge counts

**Metrics Tracked:**
- Total leads, new leads, converted leads
- Conversion rates
- Lead source analysis
- User performance metrics

---

## XV. SEARCH & GLOBAL SEARCH

### Routes: `searchRoutes.js`

**Features:**
- **Global Search**
  - GET `/api/search` - Global search across modules
  - GET `/api/search/suggestions` - Search suggestions

**Implementation:**
- Fuse.js for fuzzy search
- Cross-module search
- Intelligent suggestions

---

## XVI. API CLIENTS

### Routes: `apiClientRoutes.js`

**Features:**
- **API Client Management** (Company Admin+)
  - GET `/api/api-clients` - List API clients
  - POST `/api/api-clients` - Create API client
  - GET `/api/api-clients/:id` - Get client details
  - PUT `/api/api-clients/:id` - Update client
  - POST `/api/api-clients/:id/regenerate-secret` - Regenerate API secret
  - DELETE `/api/api-clients/:id` - Delete client
  - GET `/api/api-clients/:id/stats` - Client usage statistics

**Implementation:**
- API key authentication
- Usage tracking
- Secure secret management

---

## XVII. CHATBOT (AI ASSISTANT)

### Routes: `chatbotRoutes.js`, `chatbotController.js`, `chatbotService.js`

**Features:**
- **AI Chatbot** (Google Gemini Integration)
  - POST `/api/chatbot/message` - Process message
  - POST `/api/chatbot/confirm` - Confirm action
  - DELETE `/api/chatbot/history` - Clear history

**Capabilities:**
- Create leads via natural language
- Update lead information
- Retrieve lead details
- Search leads
- View statistics
- Provide CRM insights

**Implementation:**
- Google Gemini AI with model fallback chain:
  - Primary: `gemini-2.0-flash-exp`
  - Fallback: `gemini-1.5-flash-latest` → `gemini-1.5-pro-latest` → `gemini-pro-latest`
- Action confirmation system
- Conversation history

---

## XVIII. PLATFORM ADMINISTRATION

### Routes: `platformRoutes.js`

**Features:**
- **Platform Stats** (Super Admin)
  - GET `/api/platform/stats` - Platform statistics
  - GET `/api/platform/companies` - List all companies
  - GET `/api/platform/companies/:companyId` - Company details
  - PUT `/api/platform/companies/:companyId/status` - Update company status

- **User Management**
  - GET `/api/platform/users/search` - Search users across companies
  - POST `/api/platform/users` - Create user in company

- **Audit & Monitoring**
  - GET `/api/platform/audit-logs` - Audit logs
  - GET `/api/platform/activity` - Recent platform activity
  - GET `/api/platform/imports/telemetry` - Import telemetry

- **Impersonation**
  - POST `/api/platform/impersonate/start` - Start impersonation
  - POST `/api/platform/impersonate/end` - End impersonation

**Rate Limiting:**
- Platform-specific rate limiters
- Strict rate limiting for critical operations

---

## XIX. PICKLIST MANAGEMENT

### Routes: `picklistRoutes.js`

**Features:**
- **Lead Picklists**
  - GET `/api/picklists/leads` - List lead picklists (optional auth)
  - POST `/api/picklists/leads` - Create picklist option (Manager+)
  - PUT `/api/picklists/leads/:id` - Update picklist option (Manager+)
  - DELETE `/api/picklists/leads/:id` - Delete picklist option (Manager+)
  - PUT `/api/picklists/leads/reorder` - Reorder options (Manager+)

**Picklist Types:**
- Lead sources
- Lead statuses
- Custom picklist fields

---

## XX. SYSTEM CONFIGURATION

### Routes: `configRoutes.js`, `preferencesRoutes.js`

**Features:**
- **Configuration**
  - GET `/api/config/industry` - Industry configuration
  - GET `/api/config/form-layout` - Form layout
  - GET `/api/config/industries` - Available industries
  - GET `/api/config/terminology` - Terminology labels
  - GET `/api/config/fields` - Field definitions

- **User Preferences**
  - GET `/api/preferences` - Get user preferences
  - PUT `/api/preferences` - Update preferences
  - POST `/api/preferences/reset` - Reset to defaults

---

## ROLE-BASED ACCESS CONTROL MATRIX

| Feature | Sales Rep | Manager | Company Admin | Super Admin |
|---------|-----------|---------|---------------|-------------|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Leads | ✓ | ✓ | ✓ | ✓ |
| Contacts | ✓ | ✓ | ✓ | ✓ |
| Accounts | ✓ | ✓ | ✓ | ✓ |
| Pipeline | ✓ | ✓ | ✓ | ✓ |
| Activities | ✓ | ✓ | ✓ | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ |
| Email Templates | ✓ | ✓ | ✓ | ✓ |
| Email Sequences | ✓ | ✓ | ✓ | ✓ |
| Email Analytics | ✓ | ✓ | ✓ | ✓ |
| Assignments | ✓ | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ |
| Custom Fields | - | ✓ | ✓ | ✓ |
| Scoring Rules | - | ✓ | ✓ | ✓ |
| API Clients | - | - | ✓ | ✓ |
| Email Settings | - | - | ✓ | ✓ |
| Platform Admin | - | - | - | ✓ |
| User Management | - | - | ✓ | ✓ |
| Company Management | - | - | ✓ | ✓ |

---

## KEY TECHNICAL IMPLEMENTATIONS

### Database Architecture
- **Multi-tenant**: Row Level Security (RLS) for company-based data isolation
- **Tables**: leads, contacts, accounts, activities, tasks, users, companies, email_templates, custom_field_definitions, etc.
- **Custom Fields**: JSONB-based flexible custom field system
- **Audit Trails**: Comprehensive audit logging
- **Real-time**: Supabase real-time subscriptions

### Backend Architecture
- **MVC Pattern**: Controllers → Services → Database
- **Middleware**: Authentication, authorization, rate limiting, validation
- **Error Handling**: Centralized error middleware with ApiError class
- **Validation**: express-validator and Zod schemas
- **Rate Limiting**: Express-rate-limit on all endpoints
- **File Processing**: Multer for uploads, csv-parser, xlsx

### Frontend Architecture
- **React 18**: Functional components with hooks
- **React Router v6**: Client-side routing
- **Context API**: Authentication and picklist management
- **Tailwind CSS**: Utility-first styling
- **React Hook Form**: Form management
- **React Query**: Data fetching and caching
- **Responsive Design**: Mobile-first approach

### Integrations
- **Supabase**: Database, auth, real-time
- **Google Gemini AI**: Chatbot and insights
- **Postmark**: Email delivery
- **MJML/Handlebars**: Email template rendering
- **Vercel**: Frontend deployment
- **Fuse.js**: Fuzzy search

### Security
- **JWT Authentication**: Token-based auth with Supabase
- **CORS**: Configured for production domains
- **Helmet**: Security headers
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **Rate Limiting**: API endpoint protection

---

## FRONTEND COMPONENTS & PAGES

### Major Pages
- Dashboard - Analytics overview
- Leads - Lead management with list/grid views
- Pipeline - Kanban board visualization
- Contacts - Contact management
- Accounts - Account management
- Activities - Activity tracking
- Tasks - Task management
- Email Templates - Template editor
- Email Sequences - Sequence builder
- Reports - Report builder
- Custom Fields - Field configuration
- Settings - User preferences

### Key Components
- **Layout**: Sidebar, Header, Breadcrumbs
- **Dynamic Forms**: DynamicFormField, DynamicLeadForm
- **Pipeline**: PipelineBoard, PipelineColumn, LeadCard
- **Chatbot**: ChatbotWidget, ChatPanel, ChatMessage
- **Import/Export**: ImportWizard, ExportModal
- **UI Components**: Reusable UI primitives (Button, Input, Card, etc.)

---

## TESTING & QUALITY

### Backend Testing
- **Jest**: Unit testing
- **Supertest**: API testing
- Test coverage for controllers and services

### Frontend Testing
- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **jsdom**: DOM testing

---

## API ENDPOINT SUMMARY (150+ endpoints)

| Module | Endpoints |
|--------|-----------|
| Email System | 25+ |
| Activities | 13+ |
| Assignments | 15+ |
| Leads | 11+ |
| Pipeline | 8+ |
| Dashboard | 8+ |
| Custom Fields | 9+ |
| Users | 7+ |
| Auth | 7+ |
| Contacts | 9+ |
| Accounts | 7+ |
| Tasks | 7+ |
| Email Sequences | 10+ |
| Scoring | 6+ |
| Reports | 12+ |
| Import/Export | 7+ |
| Search | 2+ |
| API Clients | 8+ |
| Chatbot | 3+ |
| Platform Admin | 10+ |
| Picklists | 6+ |
| Configuration | 5+ |
| **TOTAL** | **150+** |

---

## DEPLOYMENT STATUS

✅ **Production**: https://chlear-crm.vercel.app
✅ **Platform**: Vercel (Frontend) + Supabase (Database/Backend)
✅ **Status**: Fully functional with all features active

---

## QUICK START COMMANDS

### Windows Users (Automated)
```bash
start-local.bat      # Start both backend (:5000) and frontend (:3000/:3001)
start-dev.bat        # Alias for start-local.bat
stop-all.bat         # Stop all services and clean ports
start-frontend.bat   # Frontend only (requires backend running)
```

### Backend Development
```bash
cd backend
npm run dev          # Start development server with nodemon (port 5000)
npm run dev:clean    # Kill port 5000 and start dev server
npm run start        # Start production server
npm run test         # Run tests with Jest
npm run seed:supabase # Bootstrap demo data (optional)
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite development server (port 3000 or 3001)
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run Vitest tests
```

---

## ENVIRONMENT SETUP

### Frontend Environment Variables
```bash
# frontend/.env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Environment Variables
```bash
# backend/.env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_jwt_secret_for_fallback
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

This comprehensive CRM system provides enterprise-grade functionality with role-based access, real-time updates, AI integration, and extensive customization options. The codebase is well-structured with clear separation of concerns and follows modern best practices for full-stack application development.
