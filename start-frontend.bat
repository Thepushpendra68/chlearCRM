@echo off
setlocal

echo [INFO] Starting CHLEAR CRM frontend development server...
cd /d "%~dp0frontend"
npm run dev

pause
endlocal
