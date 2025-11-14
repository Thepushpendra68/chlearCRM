# Sakha - Your Friend in CRM

<div align="center">

![Sakha](https://img.shields.io/badge/Sakha-CRM-blue?style=for-the-badge&logo=react&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)

A modern, full-stack Customer Relationship Management (CRM) system built with cutting-edge web technologies. Sakha (meaning friend, companion, or playmate) is designed for scalability, security, and user experience.

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🤝 Contributing](#-contributing) • [📄 License](#-license)

</div>

## ✨ Key Features

### 🔐 Authentication & Security
- **Supabase Auth Integration** with JWT token validation
- **Multi-tenant Architecture** with company-based data isolation
- **Role-based Access Control** (Super Admin, Company Admin, Manager, Sales Rep)
- **Row Level Security (RLS)** for database-level access control
- **Rate Limiting** protection against brute force attacks
- **Input Validation** and sanitization
- **CORS Protection** and security headers

### 👥 User & Lead Management
- **Complete User Management** with role assignments
- **Advanced Lead Tracking** with CRUD operations, filtering, and search
- **Pipeline Management** with visual Kanban board and drag-and-drop
- **Task & Activity Management** with timeline tracking and notifications
- **Assignment Automation** with rule-based lead distribution
- **Import/Export** functionality (CSV and Excel processing)

### 📧 Email Marketing System
- **Email Templates** - Create and manage reusable templates
- **Email Sequences** - Automated email sequence builder and management
- **Email Analytics** - Campaign performance tracking and metrics
- **Email Settings** - System-level email configuration (Admin only)

### 📊 Analytics & Reporting
- **Real-time Dashboard** with badge counts and key metrics
- **Custom Reports** with analytics and visualizations
- **Performance Metrics** and team productivity insights
- **Lead Conversion Tracking** and pipeline analytics

### 🎨 User Experience
- **Modern UI/UX** with Tailwind CSS and responsive design
- **Collapsible Sidebar** with Ctrl+B keyboard shortcut
- **Accessibility Features** built with Headless UI
- **Real-time Notifications** with badge counts
- **Role-based UI** - features shown based on user permissions
- **Mobile Responsive** with slide-out navigation

### ?? AI Chatbot Assistant
- **Google Gemini AI Integration** with fallback chain
- **Natural Language Processing** for CRM actions
- **Intelligent Insights** and assistance
- **Automatic Fallback** when AI unavailable

### 🛠️ Platform Administration
- **Custom Fields** configuration (Manager+)
- **API Clients** management (Company Admin+)
- **Platform Admin** panel (Super Admin only)
- **Company Registration** and multi-tenant setup

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** (PostgreSQL + Auth + Real-time + Row Level Security)
- **@supabase/supabase-js** for database operations
- **Google Gemini AI** (@google/generative-ai) for chatbot with model fallback
- **JWT** (jsonwebtoken) for token validation
- **Express middleware**: cors, helmet, express-rate-limit, express-validator
- **Email**: postmark, mjml, handlebars, juice, html-minifier, sanitize-html
- **Data processing**: csv-parser, xlsx for Excel/CSV operations
- **File uploads**: multer
- **Scheduling**: node-cron for email sequences
- **Utilities**: date-fns, uuid, fuse.js (fuzzy search), zod (validation), validator
- **Rate limiting**: bottleneck, p-retry

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **React Router v6** for client-side routing
- **Tailwind CSS** + **PostCSS** + **Autoprefixer** for styling
- **@headlessui/react** for accessible UI components
- **@heroicons/react** + **lucide-react** for iconography
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **@tanstack/react-query** for data fetching
- **Axios** for HTTP requests
- **Radix UI** components (@radix-ui/*)
- **Class Variance Authority (CVA)** + **clsx** + **tailwind-merge** for class management
- **Monaco Editor** for code editing
- **React Flow** for visual pipeline/flow diagrams
- **GrapesJS** for email template building
- **Vercel Analytics** for tracking

### Deployment & Infrastructure
- **Vercel** for frontend hosting (https://chlear-crm.vercel.app)
- **Vercel Serverless Functions** for backend API (api/index.js)
- **Supabase** for managed PostgreSQL database and authentication
- **GitHub Actions** for CI/CD pipeline

## 📁 Project Architecture

```
sakha/
├── 📁 backend/                    # Node.js/Express API Server
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # Route controllers & business logic
│   │   ├── 📁 middleware/         # Authentication & validation middleware
│   │   ├── 📁 models/             # Data models & schemas
│   │   ├── 📁 routes/             # API route definitions
│   │   ├── 📁 services/           # Business logic services
│   │   ├── 📁 utils/              # Utility functions & helpers
│   │   ├── 📁 config/             # Database & app configuration
│   │   ├── 📁 validators/         # Input validation schemas
│   │   └── 📄 app.js              # Express application setup
│   ├── 📁 scripts/                # Supabase maintenance scripts (demo seed, SQL runners)
│   └── 📄 package.json            # Backend dependencies
├── 📁 frontend/                   # React.js Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable React components
│   │   │   ├── 📁 Activities/     # Activity management components
│   │   │   ├── 📁 Assignment/     # Assignment & routing components
│   │   │   ├── 📁 Export/         # Data export components
│   │   │   ├── 📁 Import/         # Data import components
│   │   │   ├── 📁 Layout/         # Layout & navigation components
│   │   │   ├── 📁 Pipeline/       # Pipeline management components
│   │   │   ├── 📁 Reports/        # Reporting & analytics components
│   │   │   └── 📁 Tasks/          # Task management components
│   │   ├── 📁 pages/              # Page-level components
│   │   ├── 📁 context/            # React Context providers
│   │   ├── 📁 services/           # API service layer
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   └── 📁 utils/              # Frontend utility functions
│   └── 📄 package.json            # Frontend dependencies
├── 📁 .github/                    # GitHub workflows & templates
│   ├── 📁 workflows/              # CI/CD pipeline configuration
│   └── 📁 ISSUE_TEMPLATE/         # Issue & PR templates
├── 📄 README.md                   # Project documentation
├── 📄 CONTRIBUTING.md             # Contribution guidelines
├── 📄 CHANGELOG.md                # Version history
├── 📄 LICENSE                     # MIT License
└── 📄 .gitignore                  # Git ignore rules
```

### 🏗️ Architecture Overview

- **Backend**: Express.js REST API deployed as Vercel Serverless Function (api/index.js)
- **Frontend**: React 18 SPA with Vite build tool, deployed on Vercel
- **Database**: Supabase (PostgreSQL + Auth + Real-time + Row Level Security)
- **Authentication**: Supabase Auth with JWT token validation and role-based access control
- **Multi-tenancy**: Company-based data isolation with RLS policies
- **Deployment**: Production at https://chlear-crm.vercel.app with serverless backend

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Supabase account and project (replaces legacy database setup)
- npm or yarn

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd "C:\Users\Vishaka\Downloads\Sakha"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Supabase Setup

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Get Credentials**: Copy your Project URL and anon/service keys from Settings > API
3. **Schema Setup**: Run the SQL schema from `SUPABASE_SETUP.md` in the SQL editor, then apply incremental importer migrations:
   - `migrations/20251014_lead_import_config_tables.sql`
   - `migrations/20251014_import_telemetry.sql`
4. **Authentication**: Enable Row Level Security (RLS) and configure auth policies

### 3. Environment Configuration

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
# Legacy JWT settings (optional for fallback)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
# Optional structured log forwarding (Logflare / Datadog / etc.)
# LOG_AGGREGATOR_URL=https://logflare.app/api/logs?source=...
# LOG_AGGREGATOR_TOKEN=your_api_token
# LOG_AGGREGATOR_TIMEOUT_MS=1000
```

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Schema Setup (Supabase)

✅ **Schema is managed via Supabase - No local migrations needed**

1. **Apply Schema**: Run SQL from `SUPABASE_SETUP.md` in Supabase SQL editor
2. **Verify Setup**: Check that tables and RLS policies are created
3. **Test Authentication**: Register a company via `/api/auth/register-company`

```bash
# ❌ Legacy commands (DO NOT USE):
# cd backend
# npm run migrate
# npm run seed
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📖 Documentation

Comprehensive documentation is organized in the `/docs` directory:

### Getting Started
- **[Quick Start Guide](./README.md#-quick-start)** - Get up and running in minutes
- **[Database Setup](./docs/troubleshooting/DATABASE_SETUP.md)** - Supabase schema and migration guide

### Feature Documentation
- **[CRM Feature Roadmap](./docs/features/CRM_ROADMAP.md)** - Complete feature implementation status and upcoming features
- **[Contact Management](./docs/features/CONTACT_MANAGEMENT.md)** - Contact module implementation details

### Troubleshooting & Support
- **[Common Issues & Solutions](./docs/troubleshooting/COMMON_ISSUES.md)** - Solutions to frequently encountered problems
  - Server and route issues (404 errors, port conflicts)
  - Database setup problems
  - Authentication troubleshooting
  - Development workflow issues

### Development Guidelines
- **[CLAUDE.md](./CLAUDE.md)** - AI development guidelines and best practices
- **[agents.md](./agents.md)** - Repository guidelines for AI agents

## 👤 User Authentication

**Supabase Auth Integration**: Users register via company registration endpoint

🔐 **Company Registration**: Use `/api/auth/register-company` to create your organization and admin user

📝 **Test Users** (for development, if seeded via legacy scripts):
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sakha.com | admin123 |
| Manager | manager@sakha.com | admin123 |
| Sales Rep | sales@sakha.com | admin123 |

⚠️ **Note**: These test users are from legacy seed data. In production, use Supabase Auth registration.

## 📊 API Endpoints

### Authentication & Registration
- `POST /api/auth/register-company` - Register company and admin user (multi-tenant setup)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Leads
- `GET /api/leads` - Get all leads with pagination & filtering
- `GET /api/leads/stats` - Get lead statistics
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PUT /api/leads/:id/move-stage` - Move lead to pipeline stage
- `GET /api/leads/search` - Search leads

### Pipeline
- `GET /api/pipeline/stages` - Get pipeline stages
- `POST /api/pipeline/stages` - Create stage
- `PUT /api/pipeline/stages/:id` - Update stage
- `DELETE /api/pipeline/stages/:id` - Delete stage
- `PUT /api/pipeline/stages/reorder` - Reorder stages
- `GET /api/pipeline/overview` - Get pipeline overview
- `GET /api/pipeline/conversion-rates` - Get conversion rates

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/stats` - Get activity statistics
- `GET /api/activities/trends` - Get activity trends
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create activity
- `POST /api/activities/bulk` - Create bulk activities
- `PUT /api/activities/:id` - Update activity
- `PUT /api/activities/:id/complete` - Complete activity
- `DELETE /api/activities/:id` - Delete activity
- `GET /api/activities/leads/:id/timeline` - Get lead timeline

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/complete` - Complete task
- `DELETE /api/tasks/:id` - Delete task

### Assignments
- `GET /api/assignments/rules` - Get assignment rules
- `GET /api/assignments/rules/active` - Get active rules
- `GET /api/assignments/rules/:id` - Get rule by ID
- `POST /api/assignments/rules` - Create assignment rule
- `PUT /api/assignments/rules/:id` - Update assignment rule
- `DELETE /api/assignments/rules/:id` - Delete assignment rule
- `POST /api/assignments/leads/:leadId/assign` - Assign lead
- `POST /api/assignments/leads/bulk-assign` - Bulk assign leads
- `POST /api/assignments/leads/:leadId/auto-assign` - Auto-assign lead
- `GET /api/assignments/workload` - Get team workload

### Email Management
- `GET /api/email/templates` - Get email templates
- `POST /api/email/templates` - Create template (Manager+)
- `PUT /api/email/templates/:id` - Update template (Manager+)
- `DELETE /api/email/templates/:id` - Delete template (Admin+)
- `GET /api/email/sequences` - Get email sequences
- `POST /api/email/sequences` - Create sequence (Manager+)
- `PUT /api/email/sequences/:id` - Update sequence (Manager+)
- `DELETE /api/email/sequences/:id` - Delete sequence (Admin+)
- `POST /api/email/send/lead` - Send email to lead
- `GET /api/email/sent` - Get sent emails
- `GET /api/email/settings/integration` - Get email settings
- `POST /api/email/settings/integration` - Update email settings (Manager+)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-leads` - Get recent leads
- `GET /api/dashboard/lead-trends` - Get lead trends
- `GET /api/dashboard/lead-sources` - Get lead sources
- `GET /api/dashboard/lead-status` - Get lead status
- `GET /api/dashboard/user-performance` - Get user performance (Admin+)
- `GET /api/dashboard/badge-counts` - Get badge counts for sidebar

### Custom Fields
- `GET /api/custom-fields` - Get custom fields
- `POST /api/custom-fields` - Create custom field (Manager+)
- `PUT /api/custom-fields/:id` - Update custom field (Manager+)
- `DELETE /api/custom-fields/:id` - Delete custom field (Admin+)

### API Clients
- `GET /api/api-clients` - Get API clients (Admin+)
- `POST /api/api-clients` - Create API client (Admin+)
- `GET /api/api-clients/:id` - Get API client by ID
- `PUT /api/api-clients/:id` - Update API client
- `POST /api/api-clients/:id/regenerate-secret` - Regenerate API key
- `DELETE /api/api-clients/:id` - Delete API client
- `GET /api/api-clients/:id/stats` - Get API client stats

### Reports
- `GET /api/reports/leads` - Generate leads report
- `GET /api/reports/users` - Generate users report
- `GET /api/reports/activities` - Generate activities report

### Import/Export
- `POST /api/import/leads` - Import leads from CSV/Excel
- `POST /api/import/leads/dry-run` - Validate import file
- `GET /api/import/template` - Get import template
- `GET /api/import/history` - Get import history
- `GET /api/import/export/leads` - Export leads to CSV

### Platform Administration (Super Admin only)
- `GET /api/platform/stats` - Get platform statistics
- `GET /api/platform/companies` - Get all companies
- `PUT /api/platform/companies/:companyId/status` - Update company status
- `POST /api/platform/impersonate/:userId` - Impersonate user
- `DELETE /api/platform/impersonate` - End impersonation

### Chatbot
- `POST /api/chatbot/message` - Process chatbot message
- `POST /api/chatbot/confirm` - Confirm chatbot action
- `DELETE /api/chatbot/history` - Clear chat history

### Lead Capture (Public API)
- `POST /api/capture/lead` - Capture lead from external source
- `POST /api/capture/leads/bulk` - Bulk capture leads
- `GET /api/capture/info` - Get API information

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation with express-validator
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **SQL Injection Prevention**: Supabase client with automatic parameterized queries

## 🎨 UI Features

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean, professional interface
- **Accessibility**: Built with Headless UI components
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon
# npm run migrate    # DEPRECATED - Use Supabase schema setup
# npm run seed       # DEPRECATED - Use Supabase SQL or company registration
npm test            # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview build
npm run lint        # Run ESLint
```

## 📦 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure production database
4. Set up SSL/HTTPS
5. Use PM2 for process management

### Frontend
1. Build the application: `npm run build`
2. Serve the `dist` folder
3. Configure reverse proxy
4. Set up SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify database connection
3. Ensure all environment variables are set
4. Check that both backend and frontend are running
5. Review the API endpoints and authentication

## 🔄 Next Steps

This is a foundational CRM system. Future enhancements could include:

- **Advanced Analytics**: More detailed reporting and charts
- **Email Integration**: Automated email campaigns
- **File Uploads**: Document and image management
- **API Integrations**: Third-party service connections
- **Mobile App**: React Native mobile application
- **Real-time Features**: WebSocket integration
- **Advanced Search**: Elasticsearch integration
- **Automation**: Workflow automation and triggers

## 📈 Project Status

![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/sakha?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/yourusername/sakha?style=flat-square)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/sakha?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/yourusername/sakha?style=flat-square)

### 🎯 Current Status: **Production Ready v1.0.0**

- ✅ **Core Features**: Complete CRM functionality implemented
- ✅ **Authentication**: JWT-based auth with role management
- ✅ **Database**: Supabase-managed database with proper migrations
- ✅ **API**: RESTful endpoints with validation
- ✅ **Frontend**: React SPA with responsive design
- ✅ **Testing**: Backend tests with Jest
- ✅ **Documentation**: Comprehensive docs and guides
- ✅ **CI/CD**: GitHub Actions workflow configured

### 🚧 Roadmap

- [ ] **v1.1.0**: Advanced analytics and reporting
- [ ] **v1.2.0**: Email integration and notifications
- [ ] **v1.3.0**: Mobile app (React Native)
- [ ] **v2.0.0**: Real-time features with WebSockets
- [ ] **v2.1.0**: Advanced automation and workflows

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details, and consult the repository-specific [Agent Guidelines](AGENTS.md) when setting up your workflow.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by industry-leading CRM solutions
- Community-driven development approach

---

<div align="center">

**Made with ❤️ by the Sakha Team**

**Sakha** - *Your Friend in CRM*

[⭐ Star this repo](https://github.com/yourusername/sakha) • [🐛 Report Bug](https://github.com/yourusername/sakha/issues) • [💡 Request Feature](https://github.com/yourusername/sakha/issues)

</div>
