@echo off
echo 🚀 Starting CHLEAR CRM with Modernized Sidebar...
echo.

echo 📦 Building and starting services...
docker-compose up -d --build

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo.
echo 🌐 Your CRM is now running!
echo.
echo 📱 Frontend (Production): http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo 🗄️  Database: localhost:5432
echo.
echo 💡 To start with development mode (hot reload):
echo    docker-compose --profile dev up -d
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
pause
