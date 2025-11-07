# Account Management Module - Test Runner (PowerShell)
# This script runs all tests for the Account Management module

Write-Host "🧪 Running Account Management Module Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Backend Tests
Write-Host "📦 Running Backend Tests..." -ForegroundColor Yellow
Write-Host ""

Set-Location backend
$backendResult = npm test -- --testPathPattern="account" --passWithNoTests
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend tests failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "🎨 Running Frontend Tests..." -ForegroundColor Yellow
Write-Host ""

Set-Location ../frontend
$frontendResult = npm test -- --run --reporter=verbose Account
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend tests failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "🎉 All tests completed!" -ForegroundColor Green

Set-Location ..

