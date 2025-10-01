# CRM Backend API

A Node.js/Express backend API for a Customer Relationship Management (CRM) system.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management with Role-based Access Control
- 📊 Lead Management System
- 📈 Dashboard Analytics
- 🛡️ Security Middleware (Helmet, CORS, Rate Limiting)
- ✅ Input Validation & Error Handling
- 🗄️ Supabase Database (hosted database + Auth + Real-time)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (hosted database + Auth + Real-time)
- **Database Client**: Supabase JavaScript Client
- **Authentication**: Supabase Auth + JWT validation
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs

## Prerequisites

- Node.js (v18 or higher)
- Supabase account and project
- npm or yarn

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env` file and update the values:
   ```bash
   cp .env.example .env
   ```

3. **Set up Supabase project**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your Project URL and Service Role key from Settings > API
   - Run the SQL schema from `SUPABASE_SETUP.md` in the SQL editor

4. **(Optional) Seed demo data**:
   ```bash
   npm run seed:supabase
   ```
   This uses the Supabase service role key to create a demo company, team members, and sample leads.

## Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Configuration (optional for fallback)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run seed:supabase` - Seed demo data in Supabase (creates demo company, team members, and sample leads)
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password

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
- `GET /api/leads/stats` - Get lead statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-leads` - Get recent leads
- `GET /api/dashboard/lead-trends` - Get lead trends

## Database Schema

**✅ Schema is managed via Supabase** - See `SUPABASE_SETUP.md` for complete schema

### Key Tables (managed in Supabase)
- **Users/User Profiles** - User management with company-based multi-tenancy
- **Leads** - Lead management with pipeline integration
- **Pipeline Stages** - Customizable sales pipeline stages
- **Activities** - Activity tracking and timeline
- **Tasks** - Task management system
- **Import History** - Import tracking
- **Lead Assignment Rules** - Automated assignment rules

### Authentication & Security
- **Supabase Auth** - Built-in authentication system
- **Row Level Security (RLS)** - Company-based data isolation
- **Auth Triggers** - Automatic user profile creation

## User Authentication

**🔐 Supabase Auth Integration**: Users register via company registration

- **Company Registration**: Use `/api/auth/register-company` to create your organization
- **User Management**: Handled via Supabase Auth with custom user profiles

**Demo Accounts** (created by `npm run seed:supabase`):
- **Admin**: admin@demo-company.com / Admin123!
- **Manager**: manager@demo-company.com / Demo123!
- **Sales Rep**: sales@demo-company.com / Demo123!

Note: In production, use Supabase Auth registration instead of the seed accounts.

## Security Features

- Password hashing with bcryptjs (12 salt rounds)
- JWT token authentication
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention with Supabase client (automatic parameterized queries)
- Row Level Security (RLS) for data isolation
- Supabase Auth for secure authentication

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The server will start on `http://localhost:5000`

3. Health check endpoint: `GET /health`

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Set up proper database credentials
4. Configure CORS for your frontend domain
5. Set up SSL/HTTPS
6. Use a process manager like PM2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License