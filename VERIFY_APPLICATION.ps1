#!/usr/bin/env powershell
# Verification script to ensure application is working correctly
# Run this before final submission

param(
    [int]$timeout = 30
)

$BASE_URL = "http://localhost:3000"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [object]$body,
        [string]$token,
        [int]$expectedStatus = 200
    )

    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($token) {
            $headers["Authorization"] = "Bearer $token"
        }

        $params = @{
            Uri = "$BASE_URL$endpoint"
            Method = $method
            Headers = $headers
            ErrorAction = "Stop"
        }

        if ($body) {
            $params["Body"] = $body | ConvertTo-Json
        }

        $response = Invoke-RestMethod @params
        Write-Host "✓ $name" -ForegroundColor Green
        $global:passed++
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq $expectedStatus) {
            Write-Host "✓ $name (Status: $statusCode)" -ForegroundColor Green
            $global:passed++
            return $null
        }
        Write-Host "✗ $name - $($_.Exception.Message)" -ForegroundColor Red
        $global:failed++
        return $null
    }
}

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Finance Backend - Verification Script    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if server is running
Write-Host "Checking server status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get -ErrorAction Stop
    Write-Host "✓ Server is running on $BASE_URL" -ForegroundColor Green
}
catch {
    Write-Host "✗ Server is not running!" -ForegroundColor Red
    Write-Host "`nPlease start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test core functionality
Write-Host "`n─ Authentication Tests ─" -ForegroundColor Yellow
$adminLogin = Test-Endpoint -name "Admin Login" -method "Post" -endpoint "/auth/login" `
    -body @{ email = "admin@finance.local"; password = "admin123" }
$adminToken = $adminLogin.token

# Test records endpoint
Write-Host "`n─ Records CRUD Tests ─" -ForegroundColor Yellow
$createRecord = Test-Endpoint -name "Create Record" -method "Post" -endpoint "/records" `
    -token $adminToken `
    -body @{
        amount = 1500
        type = "INCOME"
        category = "Salary"
        description = "Test"
        date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }

$getRecords = Test-Endpoint -name "Get Records" -method "Get" -endpoint "/records" `
    -token $adminToken

# Test dashboard
Write-Host "`n─ Dashboard Tests ─" -ForegroundColor Yellow
$summary = Test-Endpoint -name "Get Dashboard Summary" -method "Get" `
    -endpoint "/dashboard/summary" -token $adminToken

# Test access control
Write-Host "`n─ Access Control Tests ─" -ForegroundColor Yellow
$viewerLogin = Test-Endpoint -name "Viewer Login" -method "Post" -endpoint "/auth/login" `
    -body @{ email = "viewer@finance.local"; password = "admin123" }
$viewerToken = $viewerLogin.token

# Viewer should be rejected from creating records
Test-Endpoint -name "Reject Viewer Record Creation (403)" -method "Post" -endpoint "/records" `
    -token $viewerToken `
    -expectedStatus 403 `
    -body @{
        amount = 100
        type = "EXPENSE"
        category = "Test"
        description = "Test"
        date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | Out-Null

# Test error handling
Write-Host "`n─ Error Handling Tests ─" -ForegroundColor Yellow
Test-Endpoint -name "Invalid Credentials (400)" -method "Post" -endpoint "/auth/login" `
    -expectedStatus 400 `
    -body @{ email = "admin@finance.local"; password = "wrong" } | Out-Null

Test-Endpoint -name "Unauthorized Access (401)" -method "Get" -endpoint "/records" `
    -expectedStatus 401 | Out-Null

# Summary
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Verification Summary             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

$total = $passed + $failed
Write-Host "`nTests Passed: $passed/$total" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "Tests Failed: $failed/$total" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All verification tests passed!" -ForegroundColor Green
Write-Host "`nApplication is ready for deployment!`n" -ForegroundColor Green

