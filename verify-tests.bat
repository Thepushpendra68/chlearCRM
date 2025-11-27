@echo off
REM WhatsApp Integration - Test Verification (Windows)

echo.
echo 🧪 WhatsApp Integration - Test Verification
echo ==========================================
echo.

REM Check Node version
echo 📦 Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)
echo ✅ Node.js version OK
echo.

REM Backend Tests
echo 🔧 Running Backend Tests...
echo ----------------------------
cd backend

if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    call npm install
)

echo Running backend tests...
call npm test
set BACKEND_EXIT=%errorlevel%

cd ..

if %BACKEND_EXIT% equ 0 (
    echo ✅ Backend tests passed
) else (
    echo ❌ Backend tests failed
)
echo.

REM Frontend Tests
echo ⚛️  Running Frontend Tests...
echo ----------------------------
cd frontend

if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

echo Running frontend tests...
call npm run test:run
set FRONTEND_EXIT=%errorlevel%

cd ..

if %FRONTEND_EXIT% equ 0 (
    echo ✅ Frontend tests passed
) else (
    echo ❌ Frontend tests failed
)
echo.

REM Summary
echo ==========================================
echo 📊 Test Summary
echo ==========================================

if %BACKEND_EXIT% equ 0 if %FRONTEND_EXIT% equ 0 (
    echo ✅ All tests passed successfully!
    echo.
    echo 🎉 WhatsApp integration is working correctly!
    echo.
    echo Next steps:
    echo 1. Configure webhook in Meta dashboard
    echo 2. Test with real WhatsApp messages
    echo 3. Deploy to production
    exit /b 0
) else (
    echo ❌ Some tests failed
    echo.
    echo Please fix the failing tests before deploying.
    echo See TEST_GUIDE.md for troubleshooting help.
    exit /b 1
)

