# CRM Backend API

A Node.js/Express backend API for a Customer Relationship Management (CRM) system.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management with Role-based Access Control
- 📊 Lead Management System
- 📈 Dashboard Analytics
- 🛡️ Security Middleware (Helmet, CORS, Rate Limiting)
- ✅ Input Validation & Error Handling
- 🗄️ PostgreSQL Database with Knex.js

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Knex.js
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
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

3. **Set up PostgreSQL database**:
   ```sql
   CREATE DATABASE crm_database;
   CREATE USER crm_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE crm_database TO crm_user;
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate
   ```

5. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
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
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback database migrations
- `npm run seed` - Run database seeds
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

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role` (ENUM: admin, manager, sales_rep)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Leads Table
- `id` (UUID, Primary Key)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `company` (VARCHAR)
- `job_title` (VARCHAR)
- `lead_source` (ENUM)
- `status` (ENUM)
- `assigned_to` (UUID, Foreign Key)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Default Users

After running seeds, you'll have these default users:

- **Admin**: admin@crm.com / admin123
- **Manager**: manager@crm.com / admin123
- **Sales Rep**: sales@crm.com / admin123

## Security Features

- Password hashing with bcryptjs (12 salt rounds)
- JWT token authentication
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention with parameterized queries

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