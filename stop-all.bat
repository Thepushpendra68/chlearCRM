@echo off
setlocal

echo [INFO] Stopping local CRM services...

for %%P in (3000 5000) do (
    echo [INFO] Checking for processes on port %%P...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P "') do (
        if "%%a" neq "" (
            echo [INFO] Terminating process %%a listening on port %%P
            taskkill /F /PID %%a >nul 2>&1
        )
    )
)

echo [INFO] Local services stopped.
pause
endlocal
