@echo off
echo 🔧 Starting CHLEAR CRM in Development Mode...
echo.

echo 📦 Building and starting development services with hot reload...
docker-compose --profile dev up -d --build

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak > nul

echo.
echo 🌐 Your CRM is now running in development mode!
echo.
echo 📱 Frontend (Dev with Hot Reload): http://localhost:3001
echo 🔧 Backend API: http://localhost:5000
echo 🗄️  Database: localhost:5432
echo.
echo ✨ Features:
echo    - Hot reload for frontend changes
echo    - Modernized sidebar with collapsible view
echo    - Quick action button for new records
echo    - Search functionality (Ctrl+K)
echo    - Notification badges
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
pause
