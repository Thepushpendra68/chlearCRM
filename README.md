# CRM - Customer Relationship Management System

A full-stack Customer Relationship Management (CRM) system built with modern web technologies.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin can manage users with different roles
- **Lead Management**: Complete CRUD operations for leads with search and filtering
- **Dashboard**: Real-time statistics and analytics
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Security**: Rate limiting, input validation, and secure authentication

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Knex.js** for database migrations and queries
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **React Hook Form** for form handling
- **Axios** for API calls
- **Headless UI** for accessible components

## 📁 Project Structure

```
crm-foundation/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration files
│   │   └── app.js           # Express app setup
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Database seeds
│   └── package.json
├── frontend/                # React.js frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd "C:\Users\Vishaka\Downloads\CHLEAR CRM"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE crm_database;

-- Create user (optional)
CREATE USER crm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crm_database TO crm_user;
```

### 3. Environment Configuration

**Backend** (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Database Migration

```bash
cd backend
npm run migrate
npm run seed
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

## 👤 Default Users

After running the seed command, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crm.com | admin123 |
| Manager | manager@crm.com | admin123 |
| Sales Rep | sales@crm.com | admin123 |

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
- **SQL Injection Prevention**: Parameterized queries with Knex.js

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
npm run migrate      # Run migrations
npm run seed         # Seed database
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

---

**Happy Coding! 🚀**