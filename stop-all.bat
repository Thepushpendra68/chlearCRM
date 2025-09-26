@echo off
echo 🛑 Stopping all CRM services...

echo 🐳 Stopping Docker containers...
docker-compose down

echo 🧹 Killing processes on ports 3000, 5000, 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    if "%%a" neq "" (
        echo Killing process %%a on port 3000
        taskkill /F /PID %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do (
    if "%%a" neq "" (
        echo Killing process %%a on port 5000
        taskkill /F /PID %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001 "') do (
    if "%%a" neq "" (
        echo Killing process %%a on port 5001
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo ✅ All services stopped!
pause