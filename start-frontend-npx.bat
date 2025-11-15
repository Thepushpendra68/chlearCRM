@echo off
setlocal

echo ========================================
echo Starting Frontend with NPX (No Install)
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [INFO] Checking if backend is running...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend is not running on port 5000!
    echo [ERROR] Please start the backend first: cd backend ^&^& npm run dev
    echo.
    pause
    exit /b 1
)

echo [OK] Backend is running
echo.

echo [INFO] Starting frontend with npx vite...
echo [INFO] Frontend URL: http://localhost:3000
echo [INFO] Press Ctrl+C to stop
echo.

npx --yes vite@4.4.5

pause
endlocal
