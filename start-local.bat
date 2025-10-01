@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "SKIP_PAUSE=%~1"

echo [INFO] Preparing local development environment...

echo [INFO] Terminating processes on ports 5000 and 3000 (if any)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do (
    if "%%a" neq "" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    if "%%a" neq "" taskkill /F /PID %%a >nul 2>&1
)

echo [INFO] Writing frontend .env for local API...
(
    echo # API Configuration
    echo VITE_API_URL=http://localhost:5000/api
    echo # Supabase Configuration (Public - safe for browser)
    echo VITE_SUPABASE_URL=https://qlivxpsvlymxfnamxvhz.supabase.co
    echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjU1NDUsImV4cCI6MjA3NDQ0MTU0NX0.p8VSaRJ-vS5ePf_2z_s-hQDrAxpS-r8vZSeijPBngIQ
) > "%SCRIPT_DIR%frontend\.env"

echo [INFO] Starting backend on port 5000...
start "Backend" cmd /k "cd /d ""%SCRIPT_DIR%backend"" && npm run start"

echo [INFO] Waiting for backend to warm up...
timeout /t 5 /nobreak >nul

echo [INFO] Starting frontend on port 3000...
start "Frontend" cmd /k "cd /d ""%SCRIPT_DIR%frontend"" && npm run dev"

echo.
echo Backend:  http://localhost:5000/health
echo Frontend: http://localhost:3000
echo API:      http://localhost:5000/api
echo.

if /I not "%SKIP_PAUSE%"=="--no-pause" (
    pause
)

endlocal
