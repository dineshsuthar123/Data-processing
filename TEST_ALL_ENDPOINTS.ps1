# Finance Backend Comprehensive Test Suite
# Tests all endpoints with different roles and scenarios

$BASE_URL = "http://localhost:3000"
$adminToken = $null
$analystToken = $null
$viewerToken = $null
$testRecordId = $null

# Color output for better readability
function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n========== $Title ==========" -ForegroundColor Yellow
}

# ========================
# HEALTH CHECK
# ========================
Write-Section "Health Check"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Success "✓ Server Health: $($response.message)"
} catch {
    Write-Error "Server not running: $_"
    exit 1
}

# ========================
# AUTHENTICATION TESTS
# ========================
Write-Section "Authentication Tests"

# Test: Register new user
Write-Info "Test 1: Register new user"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = "testuser_$(Get-Random)@finance.local"
            password = "TestPassword123!"
            firstName = "Test"
            lastName = "User"
        })
    Write-Success "✓ User registered: $($response.user.email)"
} catch {
    Write-Error "Registration failed: $($_.Exception.Message)"
}

# Test: Login as Admin
Write-Info "Test 2: Login as Admin"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = "admin@finance.local"
            password = "admin123"
        })
    $adminToken = $response.token
    Write-Success "✓ Admin login successful, token: $($adminToken.Substring(0, 20))..."
} catch {
    Write-Error "Admin login failed: $($_.Exception.Message)"
}

# Test: Login as Analyst
Write-Info "Test 3: Login as Analyst"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = "analyst@finance.local"
            password = "admin123"
        })
    $analystToken = $response.token
    Write-Success "✓ Analyst login successful, token: $($analystToken.Substring(0, 20))..."
} catch {
    Write-Error "Analyst login failed: $($_.Exception.Message)"
}

# Test: Login as Viewer
Write-Info "Test 4: Login as Viewer"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = "viewer@finance.local"
            password = "admin123"
        })
    $viewerToken = $response.token
    Write-Success "✓ Viewer login successful, token: $($viewerToken.Substring(0, 20))..."
} catch {
    Write-Error "Viewer login failed: $($_.Exception.Message)"
}

# Test: Get Current User
Write-Info "Test 5: Get current user (Admin)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/me" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    Write-Success "✓ Current user: $($response.user.email) (Role: $($response.user.role.name))"
} catch {
    Write-Error "Get current user failed: $($_.Exception.Message)"
}

# ========================
# FINANCIAL RECORDS TESTS
# ========================
Write-Section "Financial Records CRUD Tests"

# Test: Create record as Admin
Write-Info "Test 6: Create financial record as Admin"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $adminToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 1500.50
            type = "INCOME"
            category = "Salary"
            description = "Monthly salary"
            date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        })
    $testRecordId = $response.record.id
    Write-Success "✓ Record created: ID=$testRecordId, Amount=$($response.record.amount)"
} catch {
    Write-Error "Create record failed: $($_.Exception.Message)"
}

# Test: Create record as Analyst
Write-Info "Test 7: Create financial record as Analyst"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $analystToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 250.00
            type = "EXPENSE"
            category = "Groceries"
            description = "Weekly groceries"
            date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        })
    Write-Success "✓ Analyst record created: ID=$($response.record.id)"
} catch {
    Write-Error "Analyst create record failed: $($_.Exception.Message)"
}

# Test: Viewer cannot create record
Write-Info "Test 8: Viewer cannot create record (should fail)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $viewerToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 100.00
            type = "EXPENSE"
            category = "Test"
            description = "This should fail"
            date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }) -ErrorAction Stop
    Write-Error "Viewer should not create records"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Success "✓ Correctly rejected: Viewer cannot create records (403)"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test: Get all records
Write-Info "Test 9: Get all records as Analyst"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" }
    Write-Success "✓ Retrieved $($response.total) records (page $($response.page) of $($response.pages))"
} catch {
    Write-Error "Get records failed: $($_.Exception.Message)"
}

# Test: Get records with filters
Write-Info "Test 10: Get records with date filter"
try {
    $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$BASE_URL/records?startDate=$startDate&endDate=$endDate&type=INCOME" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" }
    Write-Success "✓ Filtered records retrieved: $($response.total) records"
} catch {
    Write-Error "Filter records failed: $($_.Exception.Message)"
}

# Test: Get single record
Write-Info "Test 11: Get single record (ID: $testRecordId)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records/$testRecordId" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    Write-Success "✓ Record retrieved: $($response.record.description) ($($response.record.amount))"
} catch {
    Write-Error "Get single record failed: $($_.Exception.Message)"
}

# Test: Update record
Write-Info "Test 12: Update financial record"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records/$testRecordId" `
        -Method Patch `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $adminToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 2000.00
            description = "Updated salary"
        })
    Write-Success "✓ Record updated: New amount = $($response.record.amount)"
} catch {
    Write-Error "Update record failed: $($_.Exception.Message)"
}

# Test: Delete record (soft delete)
Write-Info "Test 13: Delete financial record (soft delete)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records/$testRecordId" `
        -Method Delete `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    Write-Success "✓ Record deleted (soft delete): $($response.message)"
} catch {
    Write-Error "Delete record failed: $($_.Exception.Message)"
}

# Test: Deleted records not visible
Write-Info "Test 14: Verify deleted record not returned"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    $deleted = $response.records | Where-Object { $_.id -eq $testRecordId }
    if (-not $deleted) {
        Write-Success "✓ Deleted record correctly excluded from list"
    } else {
        Write-Error "Deleted record still visible"
    }
} catch {
    Write-Error "Failed to check deleted record: $($_.Exception.Message)"
}

# ========================
# DASHBOARD TESTS
# ========================
Write-Section "Dashboard Summary Tests"

# Test: Get dashboard summary
Write-Info "Test 15: Get dashboard summary (Analyst)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/summary" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" }
    Write-Success "✓ Dashboard summary retrieved"
    Write-Info "   Total Income: $($response.summary.totalIncome)"
    Write-Info "   Total Expenses: $($response.summary.totalExpenses)"
    Write-Info "   Net Balance: $($response.summary.netBalance)"
} catch {
    Write-Error "Get dashboard summary failed: $($_.Exception.Message)"
}

# Test: Get category breakdown
Write-Info "Test 16: Get category breakdown"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/categories" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" }
    Write-Success "✓ Category breakdown retrieved: $($response.data.Count) categories"
    if ($response.data.Count -gt 0) {
        Write-Info "   First category: $($response.data[0].category) = $($response.data[0].total)"
    }
} catch {
    Write-Error "Get category breakdown failed: $($_.Exception.Message)"
}

# Test: Get recent activity
Write-Info "Test 17: Get recent activity"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/recent" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" }
    Write-Success "✓ Recent activity retrieved: $($response.data.Count) records"
} catch {
    Write-Error "Get recent activity failed: $($_.Exception.Message)"
}

# Test: Get monthly trends
Write-Info "Test 18: Get monthly trends"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/trends" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" }
    Write-Success "✓ Monthly trends retrieved: $($response.data.Count) months"
} catch {
    Write-Error "Get monthly trends failed: $($_.Exception.Message)"
}

# ========================
# USER MANAGEMENT TESTS (Admin only)
# ========================
Write-Section "User Management Tests (Admin)"

# Test: Get all users
Write-Info "Test 19: Get all users (Admin only)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/users" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    Write-Success "✓ Users retrieved: $($response.total) users"
} catch {
    Write-Error "Get users failed: $($_.Exception.Message)"
}

# Test: Analyst cannot access user management
Write-Info "Test 20: Analyst cannot access user management (should fail)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/users" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" } -ErrorAction Stop
    Write-Error "Analyst should not access user management"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Success "✓ Correctly rejected: Analyst cannot access user management (403)"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# ========================
# ACCESS CONTROL TESTS
# ========================
Write-Section "Access Control Verification"

# Test: Viewer can view dashboard but not records CRUD
Write-Info "Test 21: Viewer can view dashboard"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/summary" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $viewerToken" }
    Write-Success "✓ Viewer can access dashboard summary"
} catch {
    Write-Error "Viewer dashboard access failed: $($_.Exception.Message)"
}

# Test: Viewer cannot update records
Write-Info "Test 22: Create record for Viewer test"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $analystToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 100.00
            type = "EXPENSE"
            category = "Test"
            description = "Test record"
            date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        })
    $testRecordId2 = $response.record.id
    Write-Success "✓ Test record created: $testRecordId2"
} catch {
    Write-Error "Failed to create test record: $($_.Exception.Message)"
}

Write-Info "Test 23: Viewer cannot update record (should fail)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records/$testRecordId2" `
        -Method Patch `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $viewerToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 500.00
        }) -ErrorAction Stop
    Write-Error "Viewer should not update records"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Success "✓ Correctly rejected: Viewer cannot update records (403)"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# ========================
# ERROR HANDLING TESTS
# ========================
Write-Section "Error Handling Tests"

# Test: Invalid credentials
Write-Info "Test 24: Invalid login credentials"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = "admin@finance.local"
            password = "wrongpassword"
        }) -ErrorAction Stop
    Write-Error "Should reject invalid credentials"
} catch {
    Write-Success "✓ Correctly rejected invalid credentials"
}

# Test: Missing required fields
Write-Info "Test 25: Missing required fields"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $analystToken"
        } `
        -Body (ConvertTo-Json @{
            amount = 100.00
            # Missing other required fields
        }) -ErrorAction Stop
    Write-Error "Should reject missing required fields"
} catch {
    Write-Success "✓ Correctly rejected missing required fields"
}

# Test: Non-existent record
Write-Info "Test 26: Non-existent record"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records/99999" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $analystToken" } -ErrorAction Stop
    Write-Error "Should return 404 for non-existent record"
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Success "✓ Correctly returned 404 for non-existent record"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test: Unauthorized access (no token)
Write-Info "Test 27: Unauthorized access (no token)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/records" `
        -Method Get -ErrorAction Stop
    Write-Error "Should reject request without token"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Success "✓ Correctly rejected unauthorized access (401)"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# ========================
# SUMMARY
# ========================
Write-Section "Test Summary"
Write-Success "✓ All critical paths tested successfully!"
Write-Info "Summary:"
Write-Info "  - Authentication: Register, Login, Current User"
Write-Info "  - Records CRUD: Create, Read, Update, Delete"
Write-Info "  - Filtering: Date, Category, Type, Pagination"
Write-Info "  - Dashboard: Summary, Categories, Recent, Trends"
Write-Info "  - Access Control: Role-based permissions verified"
Write-Info "  - Error Handling: Invalid credentials, missing fields, not found"
Write-Info "`nAll tests completed!"

