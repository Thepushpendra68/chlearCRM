@echo off
setlocal

echo [INFO] Launching local backend and frontend services...

call "%~dp0start-local.bat" --no-pause

echo.
echo [INFO] Local development services launched.
echo [INFO] Backend:  http://localhost:5000/health
echo [INFO] Frontend: http://localhost:3000

pause
endlocal
