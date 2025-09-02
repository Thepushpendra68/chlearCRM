@echo off
echo 🚀 Starting CRM Application Setup...

REM Check if we're in the right directory
if not exist "backend" (
    echo ❌ Please run this script from the CRM project root directory
    pause
    exit /b 1
)

REM Create .env file for backend if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating backend\.env file...
    (
        echo NODE_ENV=development
        echo PORT=5000
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=crm_database
        echo DB_USER=postgres
        echo DB_PASSWORD=password
        echo JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_12345
        echo JWT_EXPIRES_IN=7d
        echo CORS_ORIGIN=http://localhost:3000
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > backend\.env
    echo ✅ Created backend\.env file
) else (
    echo ✅ backend\.env file already exists
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install

REM Go back to root
cd ..

echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Create database: createdb crm_database
echo 3. Run migrations: cd backend ^&^& npm run migrate
echo 4. Seed data: cd backend ^&^& npm run seed
echo 5. Start backend: cd backend ^&^& npm run dev
echo 6. Start frontend: cd frontend ^&^& npm run dev
echo.
echo Login credentials:
echo - Admin: admin@crm.com / Admin123!
echo - Manager: manager@crm.com / Manager123!
echo - Sales: sales1@crm.com / Sales123!
echo.
pause
