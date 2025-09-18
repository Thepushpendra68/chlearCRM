@echo off
echo 🐳 Starting CHLEAR CRM with Docker...
echo.

REM Check if Docker Desktop is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker Desktop is running
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo 🚀 Starting all services...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ✅ CHLEAR CRM is now running!
    echo.
    echo 🌐 Access your application:
    echo    Frontend: http://localhost:3000
    echo    Backend:  http://localhost:5000
    echo    Database: localhost:5432
    echo.
    echo 📊 View logs: docker-compose logs -f
    echo 🛑 Stop services: docker-compose down
    echo.
) else (
    echo ❌ Failed to start services
    echo Check the logs: docker-compose logs
)

pause
