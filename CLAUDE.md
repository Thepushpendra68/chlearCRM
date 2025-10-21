# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Name
**Sakha** - Your Friend in CRM (formerly CHLEAR CRM)

## 🚀 Deployment Status
**Production:** ✅ Live at https://chlear-crm.vercel.app
**Platform:** Vercel + Supabase
**Frontend:** ✅ Working (React/Vite)
**Backend API:** ✅ Working (Express serverless function)

### Key Configuration
- **Frontend Build:** Vite build tools moved to `dependencies` (not devDependencies)
- **Backend API:** Standalone Express app in `api/index.js`
- **Routing:** `/api/*` requests rewritten to `/api/index` serverless function
- **Dependencies:** All backend dependencies in root `package.json`
- **Build Process:** Vercel auto-detects frontend build, no custom commands needed

### Critical Notes
- Build tools (vite, postcss, tailwindcss) MUST be in dependencies, not devDependencies
- Vercel production builds skip devDependencies (NODE_ENV=production)
- API routes are handled by a single Express serverless function at `api/index.js`

## ⚠️ CRITICAL DATABASE REQUIREMENTS ⚠️
**DATABASE: SUPABASE EXCLUSIVELY**
- Current branch `auth-supabase-multi-user-role` uses **Supabase ONLY**
- Hosted database with Auth, RLS (Row Level Security), and Real-time capabilities
- **NEVER** install, use, or reference sqlite3, Knex migrations, or any other database system
- Schema managed via Supabase dashboard, SQL editor, or MCP tools

## Development Commands

### 🚀 **AUTOMATED STARTUP SCRIPTS (Windows Only)**
**⚠️ WINDOWS USERS: Use these scripts for easiest setup**
```bash
start-local.bat      # Start both backend (:5000) and frontend (:3000/:3001)
start-dev.bat        # Alias for start-local.bat
stop-all.bat         # Stop all services and clean ports
start-frontend.bat   # Frontend only (requires backend running)
```
- Automatically handles port conflicts (frontend uses :3001 if :3000 is busy)
- **macOS/Linux users**: Use manual commands from Backend/Frontend sections below

### Backend Development (Node.js/Express)
```bash
cd backend
npm run dev          # Start development server with nodemon (port 5000)
npm run dev:clean    # Kill port 5000 and start dev server
npm run start        # Start production server
npm run test         # Run tests with Jest
npm run test:watch   # Run tests in watch mode
npm run kill-port    # Kill port 5000 if needed
npm run seed:supabase # Bootstrap demo data (optional)
```

### Frontend Development (React/Vite)
```bash
cd frontend
npm run dev          # Start Vite development server (port 3000 or 3001)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npm run test:run     # Run Vitest tests once
npm run test:ui      # Run tests with UI
```
**Note**: Frontend auto-selects port 3001 if 3000 is in use

### Database Schema Management
- Schema changes: Use Supabase dashboard SQL editor or MCP tools
- SQL migration files: Located in repo root (`supabase_migration*.sql`)
- **DO NOT** use Knex migrations - they have been removed

### Debugging Scripts (Optional)
Available in root directory if needed:
```bash
node debug-user-lookup.js         # Debug user authentication
node test-api.js                  # Test API endpoints
node test-token-verification.js   # Test JWT token validation
```

## Architecture Overview

This is **Sakha**, a full-stack CRM application with separated backend and frontend:

### Backend Architecture
- **Framework**: Express.js REST API with Supabase integration
- **Database**: Supabase (PostgreSQL with Auth, RLS, Real-time)
- **Authentication**: Supabase Auth with JWT token validation and fallback
- **AI Integration**: Google Gemini AI with model fallback chain:
  - Primary: `gemini-2.0-flash-exp`
  - Fallback: `gemini-1.5-flash-latest` → `gemini-1.5-pro-latest` → `gemini-pro-latest`
  - Provides intelligent chatbot assistance and CRM insights
- **Pattern**: MVC architecture (Controllers → Services → Database)
- **Middleware**: Authentication, rate limiting, CORS, input validation, error handling
- **Directory Structure**:
  - `src/controllers/` - Route handlers for all modules
  - `src/services/` - Business logic with Supabase client and AI services
  - `src/middleware/` - Auth and error handling middleware
  - `src/routes/` - API endpoint definitions
  - `src/validators/` - Input validation schemas
  - `src/utils/` - Helper functions (JWT, ApiError, parsers, generators)
  - `src/config/` - Supabase and Gemini AI configuration
  - `scripts/` - Maintenance utilities for Supabase

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
- **Role-based access control**: Super Admin, Admin, Manager, Sales Rep roles with permission hierarchy
- **Multi-tenancy**: Company-based data isolation with Row Level Security (RLS)
- **Lead management**: Full CRUD operations with filtering, search, and bulk actions
- **Pipeline management**: Visual Kanban board with drag-and-drop lead progression
- **Activity tracking**: Comprehensive activity logging with timeline views
- **Assignment automation**: Rule-based lead assignment and distribution
- **Task management**: Task creation, tracking, and notifications
- **Reporting system**: Customizable reports with analytics and visualizations
- **Import/Export**: CSV and Excel file processing for bulk operations
- **Global search**: Cross-module search with intelligent suggestions
- **Dashboard**: Real-time analytics with badge counts and recent activity
- **User management**: Admin-level user administration with role assignment
- **AI Chatbot**: Google Gemini-powered assistant for CRM insights and assistance

## Environment Setup

### Frontend Environment Variables
Create `frontend/.env`:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Environment Variables
Create `backend/.env`:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key  # Required for AI chatbot
JWT_SECRET=your_jwt_secret_for_fallback
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Initial Setup
1. **Register Company**: Use `/register-company` endpoint for multi-tenant setup
2. **First User**: Registration creates super_admin user for the company
3. **User Roles**: super_admin > admin > manager > sales_rep (descending permissions)
4. **Demo Data**: Optionally run `npm run seed:supabase` in backend for sample data

## Development Flow

### Quick Start
1. **Environment Setup**: Create `.env` files in frontend and backend directories
2. **Database Setup**: Run SQL schema from `SUPABASE_SETUP.md` in Supabase dashboard
3. **Start Services**:
   - **Windows**: Run `start-local.bat` from root
   - **macOS/Linux**: Run `npm run dev` in backend and frontend directories separately
4. **Access Application**:
   - Frontend: `http://localhost:3000` or `http://localhost:3001`
   - Backend API: `http://localhost:5000`
   - Health check: `http://localhost:5000/health`

### Development Workflow
- **Authentication**: Supabase Auth with JWT token validation
- **API Pattern**: All endpoints follow `/api/<resource>` structure
- **Error Handling**: Centralized middleware with ApiError class
- **Hot Reload**: Both frontend (Vite HMR) and backend (nodemon) auto-reload
- **Schema Changes**: Use Supabase dashboard or MCP tools only

## Testing

- Backend uses **Jest** and **Supertest**
- Frontend uses **Vitest** and **React Testing Library**
- Run `npm test` in respective directories
- Frontend has UI test runner: `npm run test:ui`

## Common Issues & Troubleshooting

### Port Conflicts
- **Windows**: Run `stop-all.bat`, wait 10 seconds, then restart
- **macOS/Linux**: Kill processes on ports 3000/3001 and 5000 manually
- Frontend auto-selects port 3001 if 3000 is in use

### Supabase Connection Issues
- Verify environment variables in both frontend and backend `.env` files
- Check `SUPABASE_SETUP.md` for proper schema setup
- Ensure auth triggers are configured in Supabase dashboard
- Verify RLS policies are enabled for multi-tenant data isolation

### Authentication Errors
- Check Supabase environment variables (URL and keys)
- Verify JWT_SECRET matches Supabase project configuration
- Ensure user has proper role assigned (super_admin, admin, manager, sales_rep)

### Development Issues
- **CORS errors**: Backend configured for localhost:3000 - update if using different port
- **Rate limiting**: May block rapid API calls during testing
- **Build tools**: Keep vite, postcss, tailwindcss in dependencies (not devDependencies)

## Important Implementation Details

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

### Production Deployment
- **Frontend**: Deployed on Vercel (https://chlear-crm.vercel.app)
- **Backend**: Express serverless function at `api/index.js`
- **Environment**: All build tools in dependencies (not devDependencies)
- **Health Checks**: Available at `/health` endpoint
- **Local Production Testing**: Use PM2 or similar process manager for backend

## Critical Implementation Details

### Data Type Handling & Validation
- **Empty Field Processing**: The backend automatically converts empty strings to `NULL` for UUID fields (`assigned_to`, `pipeline_stage_id`), date fields (`expected_close_date`), and numeric fields (`deal_value`) to prevent foreign key constraint violations
- **Phone Number Validation**: Uses flexible regex pattern `^[\+]?[0-9\s\-\(\)]{0,20}$` to support various international formats
- **Lead Form Integration**: LeadForm component handles both creation and editing modes with proper form field population and validation

### Error Handling Architecture
- **Centralized Error Middleware** (`src/middleware/errorMiddleware.js`): Handles Supabase-specific error codes (23505 unique violations, 23503 foreign key violations)
- **Development Error Logging**: Full error details including stack traces, request context, and body data logged in development mode
- **ApiError Class**: Custom error class with proper HTTP status codes and consistent error response format

### Database Constraints & Relationships
- **Foreign Key Constraints**:
  - `pipeline_stage_id` → `pipeline_stages.id`
  - `assigned_to` → `users.id`
  - `created_by` → `users.id`
  - `company_id` → `companies.id` (enforced by RLS)
- **Data Integrity**: Empty strings automatically converted to NULL to prevent constraint violations
- **Multi-tenancy**: Row Level Security (RLS) policies enforce company-based data isolation
- **Real-time Updates**: Supabase real-time subscriptions available for live data sync

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