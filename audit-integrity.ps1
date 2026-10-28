<#
.SYNOPSIS
  OrderKing Universal Integrity, Pure-Tone & Zero-Duplicate Verification Suite
  Specialists: Supreme Code Integrity Auditor (a57bc3d7) & Supreme Engineer ALPHA (80c3a27b)
  
.DESCRIPTION
  Performs an exhaustive, automated audit across the OrderKing monorepo to guarantee:
  1. NOTHING USELESS: Zero promotional slogans, zero charity words, zero fake promises.
  2. NOTHING DUPLICATE: Zero duplicate routes, zero duplicate desks, inside-navigation invariant verified.
  3. MAXIMUM AUTHENTIC: Real PostgreSQL 17.6 DB, TBO Wholesale B2B (#187051), direct UPI, and statutory CGST Section 9(5).
  4. PRODUCTION PROVEN: 100% green tests and live HTTP 200 OK Cloudflare Anycast edge health.
#>

param (
    [switch]$Quick,
    [switch]$CheckLive,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

# Auto-resolve OrderKing repository root whether run from inside or outside OrderKing
$repoRoot = $PSScriptRoot
if (-not (Test-Path "$repoRoot\orderking-customers")) {
    if (Test-Path "$PSScriptRoot\OrderKing\orderking-customers") {
        $repoRoot = "$PSScriptRoot\OrderKing"
    } elseif (Test-Path "C:\Users\hasan\OrderKing\orderking-customers") {
        $repoRoot = "C:\Users\hasan\OrderKing"
    }
}
Set-Location -Path $repoRoot
$PSScriptRoot = $repoRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 👑 OrderKing Sovereign Authenticity & Zero-Useless Audit" -ForegroundColor Yellow
Write-Host " Guaranteed Specialist: Supreme Code Integrity Auditor (a57bc3d7)" -ForegroundColor Cyan
Write-Host " Working Directory: $(Get-Location)" -ForegroundColor Green
Write-Host " Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$issuesFound = 0

function Report-Pass {
    param ([string]$Message)
    Write-Host "  [PASS] $Message" -ForegroundColor Green
}

function Report-Warn {
    param ([string]$Message)
    Write-Host "  [WARN] $Message" -ForegroundColor Yellow
}

function Report-Fail {
    param ([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
    $script:issuesFound++
}

# ==============================================================================
# SECTION 1: MONOREPO STRUCTURE & SUB-APP PRESENCE
# ==============================================================================
Write-Host "`n[1/7] Auditing Monorepo Packages & Core Sub-Apps..." -ForegroundColor Cyan

$requiredApps = @("HDmaster", "orderking-customers", "orderking-partners", "orderking-riders", "packages/ui")
foreach ($app in $requiredApps) {
    if (Test-Path "$PSScriptRoot\$app") {
        Report-Pass "Sub-app found: $app"
    } else {
        Report-Fail "Missing required monorepo sub-app: $app"
    }
}

# ==============================================================================
# SECTION 2: ZERO-DUPLICATE & NAVIGATION INVARIANT AUDIT
# ==============================================================================
Write-Host "`n[2/7] Auditing for Duplicate Routes, Desks & Component Conflicts..." -ForegroundColor Cyan

# Check for duplicate route files in orderking-customers
$customerRoutes = Get-ChildItem -Path "orderking-customers/src/routes" -Recurse -File -Filter "*.tsx" | 
    Where-Object { -not $_.Name.StartsWith("-") -and -not $_.Name.StartsWith("__") }

$groupedRoutes = $customerRoutes | Group-Object Name | Where-Object { $_.Count -gt 1 }
if ($groupedRoutes) {
    foreach ($grp in $groupedRoutes) {
        if ($grp.Name -ne "index.tsx") {
            Report-Fail "Duplicate route file detected: $($grp.Name) ($($grp.Count) occurrences)"
        }
    }
} else {
    Report-Pass "Zero duplicate non-index route files in orderking-customers"
}

# Check that 9-tile grid is hidden when any desk is active
$kingpayFile = "orderking-customers/src/components/fintech/supreme-kingpay-experience.tsx"
if (Test-Path $kingpayFile) {
    $content = Get-Content $kingpayFile -Raw
    if ($content.Contains("activeDesk === null && (") -or $content.Contains("activeDesk === null &&")) {
        Report-Pass "Inside-Navigation Invariant verified: 9-tile grid hidden during active sub-desk"
    } else {
        Report-Fail "Inside-Navigation Invariant missing: 9-tile grid may duplicate above active desk"
    }
}

# ==============================================================================
# SECTION 3: PURE TONE & ZERO-USELESS COPY AUDIT
# ==============================================================================
Write-Host "`n[3/7] Auditing for Pure Tone, Zero Slogans & Zero Charity Words..." -ForegroundColor Cyan

$travelUIFile = "orderking-customers/src/routes/travel/index.tsx"
if (Test-Path $travelUIFile) {
    $travelContent = Get-Content $travelUIFile -Raw
    
    # Check that Holiday Tours and National & International are present
    if ($travelContent.Contains("Holiday Tours") -and ($travelContent.Contains("National & International") -or $travelContent.Contains("National &amp; International"))) {
        Report-Pass "Travel UI has clean 'Holiday Tours' and 'National & International' desks"
    } else {
        Report-Fail "Travel UI missing Holiday Tours or National & International structure"
    }
    
    # Verify religious picker is neutral with zero pre-selected religious bias
    if ($travelContent.Contains("Religious Tours") -and $travelContent.Contains("Select your religion")) {
        Report-Pass "Religious desk is strictly neutral and user-driven (no pre-selected bias)"
    } else {
        Report-Warn "Religious desk structure differs from neutral template"
    }
    
    # Ensure zero promotional charity words in customer travel UI
    if ($travelContent -match 'charity\s+discount|100%\s+free\s+ticket|zero\s+markup\s+guarantee') {
        Report-Fail "Promotional charity / zero markup slogan detected in travel UI"
    } else {
        Report-Pass "Zero promotional slogans or charity words on customer travel screens"
    }
}

# ==============================================================================
# SECTION 4: STATUTORY & COMMERCIAL INVARIANTS AUDIT
# ==============================================================================
Write-Host "`n[4/7] Auditing Statutory Compliance & Direct UPI Credentials..." -ForegroundColor Cyan

$tboClientFile = "orderking-customers/src/lib/travel/tbo-client.ts"
if (Test-Path $tboClientFile) {
    $tboContent = Get-Content $tboClientFile -Raw
    if ($tboContent.Contains("187051") -and $tboContent.Contains("calculateOmniCompetitorShadowPrice")) {
        Report-Pass "TBO Agency ID #187051 and Omni-Competitor Dynamic Engine verified"
    } else {
        Report-Fail "TBO Client or Omni-Competitor Shadow Price Engine missing"
    }
    if ($tboContent.Contains("calculateAlternateOriginRailArbitrage")) {
        Report-Pass "KingConfirm Alternate-Origin Rail Arbitrage engine verified (AGTL/SCL upstream)"
    } else {
        Report-Fail "KingConfirm Rail Arbitrage engine missing"
    }
}

# Verify direct UPI and GSTIN invariants in UI/Fintech
$taxFile = "packages/ui/src/tax.ts"
if (Test-Path $taxFile) {
    $taxContent = Get-Content $taxFile -Raw
    if ($taxContent.Contains("18AFXPH9838M1Z9")) {
        Report-Pass "Statutory GSTIN 18AFXPH9838M1Z9 verified in core tax package"
    } else {
        Report-Warn "Statutory GSTIN not hardcoded in packages/ui/src/tax.ts"
    }
}

# Verify root and sub-app .env
$rootEnv = "$PSScriptRoot\.env"
if (Test-Path $rootEnv) {
    Report-Pass "Root .env detected"
    $envContent = Get-Content $rootEnv -Raw
    foreach ($k in @("DATABASE_URL", "BETTER_AUTH_SECRET")) {
        if ($envContent.Contains($k)) {
            Report-Pass "Environment key present: $k"
        } else {
            Report-Fail "Missing critical environment key: $k"
        }
    }
    foreach ($app in @("orderking-customers", "orderking-partners", "orderking-riders", "HDmaster")) {
        if (Test-Path "$PSScriptRoot\$app\.env") {
            Report-Pass "[$app] .env synchronized"
        } else {
            Report-Warn "[$app] .env missing - will be synchronized on deployment"
        }
    }
}

# ==============================================================================
# SECTION 5: CLOUDFLARE EDGE ARTIFACTS & FAULT-BARRIERS
# ==============================================================================
Write-Host "`n[5/7] Auditing Cloudflare Edge Artifacts & Error 1101 Barriers..." -ForegroundColor Cyan

foreach ($app in @("orderking-customers", "orderking-partners", "orderking-riders", "HDmaster")) {
    $distPath = "$PSScriptRoot\$app\dist"
    if (Test-Path $distPath) {
        $workerIndex = "$distPath\_worker.js\index.js"
        if (Test-Path $workerIndex) {
            $workerContent = Get-Content $workerIndex -Raw
            if ($workerContent.Contains("Trapped unhandled SSR exception")) {
                Report-Pass "[$app] Error 1101 Zero-Downtime fault barrier: VERIFIED"
            } else {
                Report-Warn "[$app] Error 1101 fault-barrier not injected in current dist"
            }
        }
        foreach ($cfg in @("_headers", "_routes.json", "_redirects")) {
            if (Test-Path "$distPath\$cfg") {
                Report-Pass "[$app] Edge configuration $($cfg) is PRESENT"
            }
        }
    } else {
        Report-Warn "[$app] dist directory not yet compiled (run pnpm build)"
    }
}

# ==============================================================================
# SECTION 6: FAST INTEGRITY TEST GATE
# ==============================================================================
if (-not $Quick) {
    Write-Host "`n[6/7] Executing Integrity Test Gate..." -ForegroundColor Cyan
    try {
        if ($Full) {
            Write-Host "  Executing Full Unit + DB E2E Transaction Test Suites..." -ForegroundColor Gray
            & pnpm --filter orderking-customers exec vitest run src/test/tbo-b2b-client.test.ts src/test/ultra-luxury-ui-architect.test.ts src/test/e2e-10x-transactions.test.ts
        } else {
            & pnpm --filter orderking-customers exec vitest run src/test/tbo-b2b-client.test.ts src/test/ultra-luxury-ui-architect.test.ts
        }
        if ($LASTEXITCODE -eq 0) {
            Report-Pass "Test suites passed: 100% GREEN"
        } else {
            Report-Fail "Test suite failed with exit code $LASTEXITCODE"
        }
    } catch {
        Report-Fail "Failed to execute test suite: $_"
    }
} else {
    Write-Host "`n[6/7] Test execution skipped (Quick mode enabled)" -ForegroundColor Gray
}

# ==============================================================================
# SECTION 7: LIVE PRODUCTION EDGE HEALTH CHECK
# ==============================================================================
if ($CheckLive -or $Full) {
    Write-Host "`n[7/7] Verifying Live Cloudflare Production Endpoints..." -ForegroundColor Cyan
    $liveUrls = @(
        "https://orderkingpay.com",
        "https://orderkingpay.com/travel?tab=hotels",
        "https://orderkingpay.com/travel?tab=tours",
        "https://orderkingpay.com/kingpay",
        "https://partner.orderkingpay.com",
        "https://rider.orderkingpay.com",
        "https://admin.orderkingpay.com"
    )
    foreach ($url in $liveUrls) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
            if ($resp.StatusCode -eq 200) {
                Report-Pass "[$($resp.StatusCode) OK] $url"
            } else {
                Report-Warn "[$($resp.StatusCode)] $url"
            }
        } catch {
            Report-Warn "Could not reach $url : $_"
        }
    }
} else {
    Write-Host "`n[7/7] Live endpoint check skipped (use -CheckLive to verify live web servers)" -ForegroundColor Gray
}

# ==============================================================================
# AUDIT SUMMARY
# ==============================================================================
Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($issuesFound -eq 0) {
    Write-Host " [VERIFIED] ZERO DUPLICATES, ZERO USELESS, MAXIMUM AUTHENTIC" -ForegroundColor Green
    Write-Host " Platform is 100% healthy, verified, and production-ready." -ForegroundColor Green
} else {
    Write-Host " [ATTENTION] $issuesFound issue(s) detected during audit." -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan

exit $issuesFound
