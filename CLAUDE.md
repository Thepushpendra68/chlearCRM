# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL DATABASE REQUIREMENTS ⚠️
**THIS PROJECT SUPPORTS TWO DATABASE CONFIGURATIONS:**
1. **TRADITIONAL**: PostgreSQL with local/Docker setup (legacy)
2. **MODERN**: Supabase (PostgreSQL + Auth + Real-time) - **CURRENT ACTIVE BRANCH**

**NEVER INSTALL, USE, OR REFERENCE SQLITE3 IN ANY FORM**
**CURRENT BRANCH: `auth-supabase-multi-user-role` - Uses Supabase exclusively**

## Development Commands

### 🚀 **AUTOMATED STARTUP SCRIPTS (RECOMMENDED)**
```bash
# Windows batch scripts for seamless development:
start-dev.bat        # Docker mode: Backend on :5001, Frontend on :3000
start-local.bat      # Local mode: Backend on :5000, Frontend on :3000
stop-all.bat         # Stop all services and clean ports
```
**These scripts automatically handle port conflicts and configuration**

### Backend Development (Node.js/Express)
```bash
cd backend
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run migrate      # Run database migrations (PostgreSQL mode)
npm run seed         # Seed database with sample data (PostgreSQL mode)
npm run test         # Run tests with Jest
npm run test:watch   # Run tests in watch mode
npm run kill-port    # Kill port 5000 if needed
```

### Frontend Development (React/Vite)
```bash
cd frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npm run test:ui      # Run tests with UI
```

### Supabase Integration Commands
```bash
# Supabase-specific operations:
node backend/migrate-supabase.js     # Apply Supabase migrations
node backend/verify-fix.js           # Verify Supabase setup
node debug-user-lookup.js            # Debug user authentication
```

### Database Operations
```bash
cd backend
npm run migrate:rollback  # Rollback last migration
knex migrate:make <name>  # Create new migration
knex seed:make <name>     # Create new seed file
```

### Additional Commands
```bash
# Backend testing
cd backend
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode

# Frontend linting
cd frontend
npm run lint         # Run ESLint checks
```

## Architecture Overview

This is a full-stack CRM application with separated backend and frontend:

### Backend Architecture
- **Express.js** REST API with hybrid authentication system
- **Database**: Supabase (PostgreSQL + Auth) on current branch, with legacy Knex.js support
- **⚠️ CRITICAL: CURRENT BRANCH USES SUPABASE - NEVER USE SQLITE3**
- **Authentication**: Dual-mode (Supabase Auth + JWT fallback)
- **MVC pattern**: Controllers → Services → Database
- **Middleware**: Authentication, rate limiting, CORS, validation
- **Structure**:
  - `src/controllers/` - Route handlers (auth, leads, users, dashboard, pipeline, activities, assignments, reports, tasks, import, search)
  - `src/services/` - Business logic layer
  - `src/middleware/` - Custom middleware (auth, error handling)
  - `src/routes/` - API route definitions
  - `src/validators/` - Input validation schemas
  - `src/utils/` - Utility functions (JWT, ApiError, assignment rules, report generator, parsers)
  - `src/config/` - Configuration files
  - `migrations/` - Database schema migrations
  - `seeds/` - Database seed data

### Frontend Architecture  
- **React 18** with functional components and hooks
- **React Router v6** for routing
- **Context API** for authentication state
- **Tailwind CSS** for styling
- **Structure**:
  - `src/pages/` - Page components (Dashboard, Leads, Users, Pipeline, Activities, Assignments, Reports, Tasks)
  - `src/components/` - Reusable UI components organized by feature (Layout, Pipeline, Activities, Assignment, Reports, Tasks, Import, Export, Search)
  - `src/context/` - React Context providers (AuthContext)
  - `src/services/` - API service functions for each module
  - `src/hooks/` - Custom React hooks (useDragAndDrop)
  - Layout structure with protected routes and role-based access

### Key Features
- **Role-based access control**: Admin, Manager, Sales Rep roles
- **Lead management**: CRUD operations with filtering and search
- **Pipeline management**: Visual Kanban board for lead progression
- **Activity tracking**: Comprehensive activity logging and timeline
- **Assignment automation**: Rule-based lead assignment system
- **Task management**: Task creation and tracking system
- **Reporting system**: Customizable reports and analytics
- **Import/Export**: CSV and Excel import/export functionality
- **Global search**: Cross-module search functionality with suggestions
- **Dashboard**: Analytics and recent activity
- **User management**: Admin-only user administration

## Environment Setup

### Supabase Configuration (Current Branch)
Frontend requires `.env` file with:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Backend requires `.env` file with:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Legacy PostgreSQL Configuration
Backend `.env` for traditional setup:
- Database connection: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- JWT configuration: `JWT_SECRET`, `JWT_EXPIRES_IN`
- CORS configuration: `FRONTEND_URL`
- Rate limiting: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
- Environment: `NODE_ENV`, `PORT`

### Authentication Setup
**Supabase Mode**: Register via `/register-company` endpoint for multi-tenant setup
**Legacy Mode**: Default credentials after seeding:
- Admin: `admin@crm.com` / `admin123`
- Manager: `manager@crm.com` / `admin123`
- Sales Rep: `sales@crm.com` / `admin123`

## Development Flow

### Recommended Workflow (Current Branch)
1. **Use automated scripts**: `start-dev.bat` or `start-local.bat`
2. **Port configuration**: Backend varies by mode (5000 local, 5001 docker), Frontend always 3000
3. **Supabase setup**: Run SQL setup from `SUPABASE_SETUP.md` if needed
4. **Authentication**: Supabase Auth tokens with fallback to JWT
5. **API endpoints** follow `/api/<resource>` pattern
6. **Error handling**: Centralized error middleware with ApiError class

### Legacy Workflow
1. **Database first**: Run migrations and seeds before starting servers
2. **Manual startup**: `npm run dev` in backend/frontend directories
3. **Authentication**: JWT tokens in Authorization headers

## Testing

- Backend uses **Jest** and **Supertest**
- Frontend uses **Vitest** and **React Testing Library**
- Run `npm test` in respective directories
- Frontend has UI test runner: `npm run test:ui`

## Common Issues

### Current Branch (Supabase)
- **Port conflicts**: Use `stop-all.bat` then restart with appropriate script
- **Supabase setup**: Check `SUPABASE_SETUP.md` for database schema setup
- **Authentication errors**: Verify Supabase environment variables in frontend
- **Company registration**: Ensure auth triggers are properly configured in Supabase

### Legacy Issues
- Ensure PostgreSQL is running before starting backend
- CORS configured for localhost:3000 development
- Rate limiting may block rapid API calls during development
- JWT tokens expire based on JWT_EXPIRES_IN setting

### Automated Scripts Troubleshooting
- If scripts fail, run `stop-all.bat` and wait 10 seconds before retrying
- Check that Docker is running for `start-dev.bat`
- Ensure no other applications are using ports 3000, 5000, or 5001

## Important Implementation Details

### Database Schema Evolution
- The leads table has been extended beyond the base migration (002_create_leads_table.js)
- Pipeline integration added via migration 006_modify_leads_for_pipeline.js
- Missing fields `created_by` and `priority` added via migration 011_add_missing_leads_fields.js
- Always run `npm run migrate` after pulling changes to ensure schema is up to date

### API Response Patterns
- All API responses follow consistent structure: `{ success: boolean, data: any, message?: string }`
- Error responses use centralized ApiError class with proper HTTP status codes
- Lead endpoints return full objects with joined user information where applicable

### Frontend State Management
- Authentication state managed via AuthContext (`src/context/AuthContext.jsx`)
- Forms use React Hook Form with validation schemas matching backend validators
- API calls handled through service modules (`src/services/`) with consistent error handling
- Toast notifications via react-hot-toast for user feedback

### Key Integration Points
- Lead creation flow: Form → leadService.createLead() → Backend API → Database → Response → Frontend refresh
- Authentication flow: Login → JWT token → AuthContext → Protected routes
- Data fetching: useEffect hooks → service calls → state updates → UI refresh

### Development Workflow Notes
- Backend server runs on port 5000 with auto-reload via nodemon
- Frontend runs on port 3000 with Vite hot module replacement
- Database changes require migration files - never modify existing migrations
- Frontend changes auto-reload in browser during development

### Docker & Deployment
- **Docker Compose**: Full containerization with PostgreSQL, backend, and frontend services
- **Health Checks**: Configured for all services with graceful shutdown
- **Vercel Integration**: Frontend deployment configuration available
- **Development**: Use `docker-compose up` for complete environment

## Critical Implementation Details

### Data Type Handling & Validation
- **Empty Field Processing**: The backend automatically converts empty strings to `NULL` for UUID fields (`assigned_to`, `pipeline_stage_id`), date fields (`expected_close_date`), and numeric fields (`deal_value`) to prevent foreign key constraint violations
- **Phone Number Validation**: Uses flexible regex pattern `^[\+]?[0-9\s\-\(\)]{0,20}$` to support various international formats
- **Lead Form Integration**: LeadForm component handles both creation and editing modes with proper form field population and validation

### Error Handling Architecture
- **Centralized Error Middleware** (`src/middleware/errorMiddleware.js`): Handles PostgreSQL-specific errors (23505 unique violations, 23503 foreign key violations)
- **Development Error Logging**: Full error details including stack traces, request context, and body data logged in development mode
- **ApiError Class**: Custom error class with proper HTTP status codes and consistent error response format

### Database Constraints & Relationships
- **DATABASE TYPE: POSTGRESQL (Supabase or traditional) - NEVER USE SQLITE3**
- **Current Branch**: Uses Supabase with RLS policies and auth triggers
- **Foreign Key Constraints**: `pipeline_stage_id` references `pipeline_stages.id`, `assigned_to` references `users.id`
- **Migration Dependencies**:
  - **Supabase**: Use migration scripts in root directory or manual SQL execution
  - **Legacy**: Always run `npm run migrate` after pulling changes
- **Data Integrity**: Empty string validation converted to NULL prevents constraint violations during updates
- **Multi-tenancy**: Company-based data isolation with Row Level Security (RLS) policies

### Form & State Management Patterns
- **Frontend Validation**: React Hook Form with schemas matching backend express-validator rules
- **Backend Validation**: Custom validators handle empty strings, UUID validation, and optional field processing
- **Update Process**: Frontend → leadService.updateLead() → validation → data cleaning → database update → response refresh
- **Lead Detail Pages**: Clickable lead rows navigate to `/leads/:id` with comprehensive detail view and edit functionality

### Navigation & Routing Architecture
- **Protected Routes**: All main routes wrapped in ProtectedRoute component with authentication checks
- **Role-Based Access**: Different views and permissions based on user roles (admin, manager, sales rep)
- **Modal Management**: Forms use modal overlays for create/edit operations with proper state management
- **Toast Notifications**: react-hot-toast provides consistent user feedback across all operations

## Controller Method Binding Patterns

### Critical Implementation Pattern
- **Arrow Function Methods**: Use arrow functions for controller methods to maintain proper `this` binding in async contexts
- **Example**: `exportLeads = async (req, res, next) => { ... }` instead of `async exportLeads(req, res, next) { ... }`
- **Why**: Prevents `TypeError: Cannot read properties of undefined` when calling instance methods like `this.convertToCSV()`
- **Affected Controllers**: ImportController methods must use arrow functions for proper context binding

### Import/Export System Architecture
- **File Processing**: CSV/Excel parsing with `csv-parser` and `xlsx` packages
- **Export Flow**: Frontend request → Controller → ImportService → ExcelParser/CSV conversion → File download
- **Error Handling**: Empty data gracefully handled by creating header-only files
- **Method Dependencies**: Export methods call `this.convertToCSV()` and `this.convertToExcel()` requiring proper binding

### Recent Critical Bug Fixes
- **Export Functionality**: Fixed `this` binding issue in ImportController export methods by converting to arrow functions
- **Excel Empty Data**: Modified ExcelParser to handle empty datasets by generating header-only files
- **Lead Update Processing**: Backend automatically converts empty strings to `NULL` for UUID/date/numeric fields
- **Phone Validation**: Flexible regex `^[\+]?[0-9\s\-\(\)]{0,20}$` supports international formats
- **Foreign Key Handling**: Empty string validation prevents constraint violations during updates

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.