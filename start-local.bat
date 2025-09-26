@echo off
echo 🧹 Cleaning up any existing processes...

REM Kill any processes on ports 5000, 5001, 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do (
    if "%%a" neq "" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001 "') do (
    if "%%a" neq "" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    if "%%a" neq "" taskkill /F /PID %%a >nul 2>&1
)

echo 🐳 Stopping Docker containers...
docker-compose down

echo 📝 Updating frontend config for local development...
echo # API Configuration > frontend\.env
echo VITE_API_URL=http://localhost:5000/api >> frontend\.env
echo # Supabase Configuration (Public - safe for browser) >> frontend\.env
echo VITE_SUPABASE_URL=https://qlivxpsvlymxfnamxvhz.supabase.co >> frontend\.env
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjU1NDUsImV4cCI6MjA3NDQ0MTU0NX0.p8VSaRJ-vS5ePf_2z_s-hQDrAxpS-r8vZSeijPBngIQ >> frontend\.env

echo 🚀 Starting backend on port 5000...
start "Backend" cmd /k "cd backend && npm run start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting frontend on port 3000...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo ✅ All services started!
echo.
echo 🌐 Backend: http://localhost:5000/health
echo 🖥️  Frontend: http://localhost:3000
echo 📊 Backend API: http://localhost:5000/api
echo.
pause