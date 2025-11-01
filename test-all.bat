@echo off
REM Test runner for both backend and frontend tests
REM Run from project root: test-all.bat

echo ======================================
echo   ChlearCRM - Test Suite Runner
echo ======================================
echo.

REM Colors (limited in Windows batch)
echo [36mStarting test suite...[0m
echo.

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo [33mWarning: backend\node_modules not found. Run 'npm install' in backend directory.[0m
    echo.
)

if not exist "frontend\node_modules" (
    echo [33mWarning: frontend\node_modules not found. Run 'npm install' in frontend directory.[0m
    echo.
)

REM Backend Tests
echo ======================================
echo   1. Backend Tests (Jest)
echo ======================================
echo.

cd backend
if errorlevel 1 (
    echo [31mError: Cannot access backend directory[0m
    exit /b 1
)

echo Running Jest tests...
call npm test -- --passWithNoTests
set BACKEND_EXIT_CODE=%ERRORLEVEL%

cd ..

if %BACKEND_EXIT_CODE% neq 0 (
    echo.
    echo [31m✗ Backend tests FAILED[0m
    echo.
) else (
    echo.
    echo [32m✓ Backend tests PASSED[0m
    echo.
)

REM Frontend Tests
echo ======================================
echo   2. Frontend Tests (Vitest)
echo ======================================
echo.

cd frontend
if errorlevel 1 (
    echo [31mError: Cannot access frontend directory[0m
    exit /b 1
)

echo Running Vitest tests...
call npm run test:run
set FRONTEND_EXIT_CODE=%ERRORLEVEL%

cd ..

if %FRONTEND_EXIT_CODE% neq 0 (
    echo.
    echo [31m✗ Frontend tests FAILED[0m
    echo.
) else (
    echo.
    echo [32m✓ Frontend tests PASSED[0m
    echo.
)

REM Summary
echo ======================================
echo   Test Results Summary
echo ======================================
echo.

if %BACKEND_EXIT_CODE% equ 0 (
    echo Backend:  [32m✓ PASSED[0m
) else (
    echo Backend:  [31m✗ FAILED[0m
)

if %FRONTEND_EXIT_CODE% equ 0 (
    echo Frontend: [32m✓ PASSED[0m
) else (
    echo Frontend: [31m✗ FAILED[0m
)

echo.

REM Final exit code
if %BACKEND_EXIT_CODE% neq 0 exit /b %BACKEND_EXIT_CODE%
if %FRONTEND_EXIT_CODE% neq 0 exit /b %FRONTEND_EXIT_CODE%

echo [32m======================================[0m
echo [32m  All Tests Passed Successfully! ✓[0m
echo [32m======================================[0m
echo.
exit /b 0

