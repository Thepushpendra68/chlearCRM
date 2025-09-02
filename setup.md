# CRM Setup Instructions

## Issues Fixed:
1. ✅ Updated demo credentials to match seed data
2. ✅ Fixed API base URL in authService.js
3. ✅ Fixed missing div wrapper in Login component

## Setup Steps:

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up Database
```bash
# From backend directory
cd backend

# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

### 3. Start the Application

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 5. Login Credentials
- **Admin**: admin@crm.com / Admin123!
- **Manager**: manager@crm.com / Manager123!
- **Sales Rep**: sales1@crm.com / Sales123!

## Troubleshooting:

### If login still doesn't work:

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check database connection:**
   - Make sure PostgreSQL is running
   - Check your database configuration in `backend/src/config/database.js`

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for any network errors or JavaScript errors

4. **Verify sample data:**
   ```bash
   cd backend
   npm run seed
   ```

### Common Issues:
- **CORS errors**: Backend should handle CORS automatically
- **Database connection**: Make sure PostgreSQL is running and accessible
- **Port conflicts**: Make sure ports 3000 and 5000 are available

## Environment Variables:
Create `.env` file in backend directory:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
```

## Next Steps:
Once login is working, you can:
1. Create new leads
2. Manage users (admin only)
3. View dashboard analytics
4. Test all CRUD operations
