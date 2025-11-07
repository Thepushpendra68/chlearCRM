# PowerShell Script to Restart Backend and Verify Account Routes
# Run this: .\restart-and-verify.ps1

Write-Host "🔄 Restarting Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "Step 1: Killing all node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 3

# Step 2: Verify port 5000 is free
Write-Host "Step 2: Checking if port 5000 is free..." -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":5000"
if ($portCheck) {
    Write-Host "❌ Port 5000 still in use!" -ForegroundColor Red
    Write-Host "   Run 'taskkill /F /IM node.exe' again" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Port 5000 is free" -ForegroundColor Green
}

# Step 3: Start server in new window
Write-Host "Step 3: Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Opening new terminal window for backend..." -ForegroundColor Cyan
Write-Host "⚠️  LOOK FOR THESE LOGS IN THE NEW WINDOW:" -ForegroundColor Yellow
Write-Host "   📦 [ACCOUNT ROUTES] Loading account routes module..." -ForegroundColor White
Write-Host "   ✅ [ACCOUNT ROUTES] Router created successfully" -ForegroundColor White
Write-Host "   ✅ [APP] Account routes loaded successfully: true" -ForegroundColor White
Write-Host "   🔗 [APP] Registering /api/accounts routes..." -ForegroundColor White
Write-Host "   ✅ [APP] /api/accounts routes registered" -ForegroundColor White
Write-Host "   🚀 Server running on port 5000" -ForegroundColor White
Write-Host ""

# Start server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Write-Host "⏳ Waiting 10 seconds for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Test the endpoint
Write-Host "Step 4: Testing /api/accounts endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/accounts" -Method GET -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

Write-Host ""
Write-Host "📊 TEST RESULTS" -ForegroundColor Cyan
Write-Host "=" * 60

if ($statusCode -eq 404) {
    Write-Host "❌ STILL GETTING 404!" -ForegroundColor Red
    Write-Host "   Problem: Server didn't load the routes" -ForegroundColor Red
    Write-Host "   Check the server window - did you see the ✅ emoji logs?" -ForegroundColor Yellow
    Write-Host "   If not, the code changes didn't load." -ForegroundColor Yellow
} elseif ($statusCode -eq 401) {
    Write-Host "✅ SUCCESS! Route is working!" -ForegroundColor Green
    Write-Host "   Status: 401 Unauthorized (expected - needs auth)" -ForegroundColor Green
    Write-Host "   The /api/accounts route is properly registered!" -ForegroundColor Green
} elseif ($statusCode -eq 200) {
    Write-Host "✅ SUCCESS! Route is working perfectly!" -ForegroundColor Green
    Write-Host "   Status: 200 OK" -ForegroundColor Green
    Write-Host "   The /api/accounts route is working!" -ForegroundColor Green
} elseif ($statusCode -eq 500) {
    Write-Host "⚠️  Route exists but database error" -ForegroundColor Yellow
    Write-Host "   Status: 500 Internal Server Error" -ForegroundColor Yellow
    Write-Host "   Route is registered, but you need to run migrations in Supabase" -ForegroundColor Yellow
} else {
    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60
Write-Host ""

if ($statusCode -eq 404) {
    Write-Host "❌ NEXT STEPS:" -ForegroundColor Red
    Write-Host "1. Look at the server window that just opened" -ForegroundColor White
    Write-Host "2. Do you see lines starting with 📦 and ✅?" -ForegroundColor White
    Write-Host "3. If NO, then run: git pull" -ForegroundColor White
    Write-Host "4. If YES, take a screenshot and share it" -ForegroundColor White
} elseif ($statusCode -eq 401 -or $statusCode -eq 200) {
    Write-Host "✅ NEXT STEPS:" -ForegroundColor Green
    Write-Host "1. Refresh your browser (F5)" -ForegroundColor White
    Write-Host "2. The 404 error should be gone!" -ForegroundColor White
    Write-Host "3. You should see the Accounts page working" -ForegroundColor White
} elseif ($statusCode -eq 500) {
    Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Go to Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "2. Run the migration: migrations/20250101_create_accounts_table.sql" -ForegroundColor White
    Write-Host "3. Refresh your browser" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

