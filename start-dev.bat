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

echo 🐳 Starting Docker containers...
docker-compose down
docker-compose up -d

echo ⏳ Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

echo 🌐 Backend will be available at: http://localhost:5001/health
echo 🖥️  Frontend will be available at: http://localhost:3000
echo 📊 Backend API: http://localhost:5001/api

echo ✅ All services started!
echo.
echo 🔍 To check logs:
echo    docker logs chlear-crm-backend -f
echo    docker logs chlear-crm-frontend -f
echo.
pause