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
- **JWT-based Authentication** with secure token management
- **Role-based Access Control** (Admin, Manager, Sales Rep)
- **Password Hashing** with bcryptjs (12 salt rounds)
- **Rate Limiting** protection against brute force attacks
- **Input Validation** and sanitization
- **CORS Protection** and security headers

### 👥 User & Lead Management
- **Complete User Management** with role assignments
- **Advanced Lead Tracking** with custom fields
- **Pipeline Management** with drag-and-drop interface
- **Task & Activity Management** with timeline tracking
- **Assignment & Routing System** with workload balancing
- **Bulk Operations** for efficient data management

### 📊 Analytics & Reporting
- **Real-time Dashboard** with key performance indicators
- **Advanced Analytics** with trend analysis
- **Custom Report Builder** with export capabilities
- **Lead Conversion Tracking** and pipeline analytics
- **Performance Metrics** and team productivity insights

### 🎨 User Experience
- **Responsive Design** optimized for all devices
- **Modern UI/UX** with Tailwind CSS
- **Accessibility Features** built with Headless UI
- **Real-time Notifications** and toast messages
- **Dark/Light Mode** support (coming soon)
- **Progressive Web App** capabilities

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** (hosted database + Auth + Real-time)
- **Supabase Client** for database operations and authentication
- **JWT** for token validation (Supabase managed)
- **bcryptjs** for password hashing (legacy fallback)
- **express-validator** for input validation

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **React Hook Form** for form handling
- **Axios** for API calls
- **Headless UI** for accessible components

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

- **Backend**: RESTful API with Express.js, Supabase integration, JWT token validation
- **Frontend**: Single Page Application with React 18, Vite build tool, Tailwind CSS
- **Database**: Supabase (hosted database + Auth + Real-time + RLS policies)
- **Authentication**: Supabase Auth with JWT tokens and role-based access control
- **Deployment**: Local-development-friendly with CI/CD pipeline support, Supabase hosted database

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
3. **Schema Setup**: Run the SQL schema from `SUPABASE_SETUP.md` in the SQL editor
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

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Leads
- `GET /api/leads` - Get all leads (with pagination & filtering)
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-leads` - Get recent leads
- `GET /api/dashboard/lead-trends` - Get lead trends

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
3. Configure reverse proxy (nginx)
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

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

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