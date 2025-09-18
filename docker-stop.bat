@echo off
echo 🛑 Stopping CHLEAR CRM services...
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo Stopping all containers...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo ✅ All services stopped successfully!
    echo.
    echo 💡 To start again:
    echo    Production: docker-start.bat
    echo    Development: docker-dev.bat
    echo.
) else (
    echo ❌ Failed to stop services
    echo Check the logs: docker-compose logs
)

pause
