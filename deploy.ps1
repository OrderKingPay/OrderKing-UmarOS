# OrderKing Unified Enterprise Deployment Script (PowerShell)
# Supreme Engineer OMEGA (183f728c) - Production Deployment Architecture
# Automatically sets working directory to repository root

param (
    [string]$Action = "status"
)

$ErrorActionPreference = "Stop"

# Navigate to script root (C:\Users\hasan\OrderKing)
Set-Location -Path $PSScriptRoot
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " OrderKing Quad-Core Ecosystem Deployment" -ForegroundColor Yellow
Write-Host " Working Directory: $(Get-Location)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Find Node executable (prefer real standalone Node over Antigravity Electron runner)
$nodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
}

if (-not (Test-Path $nodeExe)) {
    throw "Fatal: Node.js executable not located. Please install Node.js v22+."
}

# Fail-Closed Command Runner with Configurable Retries
function Invoke-CheckedStep {
    param (
        [string]$Description,
        [scriptblock]$Script,
        [int]$MaxRetries = 1
    )
    $attempt = 1
    while ($attempt -le $MaxRetries) {
        if ($MaxRetries -gt 1) {
            Write-Host "`n>>> $Description (Attempt $attempt/$MaxRetries)..." -ForegroundColor Cyan
        } else {
            Write-Host "`n>>> $Description..." -ForegroundColor Cyan
        }
        & $Script
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Write-Host "Warning: $Description failed on attempt $attempt with exit code $LASTEXITCODE" -ForegroundColor Yellow
        if ($attempt -lt $MaxRetries) {
            Write-Host "Retrying in 4 seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 4
        }
        $attempt++
    }
    Write-Host "FAILED: $Description terminated after $MaxRetries attempt(s) with exit code $LASTEXITCODE" -ForegroundColor Red
    throw "Pipeline failure: $Description terminated with exit code $LASTEXITCODE"
}

switch ($Action.ToLower()) {
    "test" {
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " Qualifying OrderKing Ecosystem (Running Test Suites)..." -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Cyan
        
        Invoke-CheckedStep "[1/4] Testing HDmaster (Umar OS)" {
            Push-Location HDmaster
            try { pnpm test } finally { Pop-Location }
        }

        Invoke-CheckedStep "[2/4] Testing OrderKing Customers" {
            Push-Location orderking-customers
            try { pnpm test } finally { Pop-Location }
        }

        Invoke-CheckedStep "[3/4] Testing OrderKing Partners" {
            Push-Location orderking-partners
            try { pnpm test } finally { Pop-Location }
        }

        Invoke-CheckedStep "[4/4] Testing OrderKing Riders" {
            Push-Location orderking-riders
            try { pnpm test } finally { Pop-Location }
        }

        Write-Host "`n==========================================================" -ForegroundColor Green
        Write-Host " All Ecosystem Tests Qualified Successfully!" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
    }
    "all" {
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " OrderKing Full Qualification & Live Deployment Pipeline" -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Cyan
        
        & "$PSScriptRoot\deploy.ps1" -Action test
        & "$PSScriptRoot\deploy.ps1" -Action build
        & "$PSScriptRoot\deploy.ps1" -Action deploy
    }
    "start" {
        Write-Host "Starting All OrderKing Production Preview Servers..." -ForegroundColor Cyan
        & "$PSScriptRoot\START_ALL_PREVIEWS.ps1"
    }
    "dev" {
        Write-Host "Starting Development Mode..." -ForegroundColor Cyan
        pnpm dev
    }
    "deploy" {
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " Deploying All Platforms to Cloudflare Pages..." -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Cyan

        $wranglerJs = "$PSScriptRoot\node_modules\wrangler\bin\wrangler.js"
        if (-not (Test-Path $wranglerJs)) {
            throw "Fatal: Wrangler binary not found at $wranglerJs"
        }

        Invoke-CheckedStep "[1/5] Deploying orderking-customers -> orderkingpay.com" {
            & $nodeExe $wranglerJs pages deploy orderking-customers/dist --project-name=orderking-customers --branch=main --commit-dirty=true
        } -MaxRetries 3

        Invoke-CheckedStep "[2/5] Deploying orderking-partners -> partner.orderkingpay.com" {
            & $nodeExe $wranglerJs pages deploy orderking-partners/dist --project-name=orderking-partners --branch=main --commit-dirty=true
        } -MaxRetries 3

        Invoke-CheckedStep "[3/5] Deploying orderking-riders -> rider.orderkingpay.com" {
            & $nodeExe $wranglerJs pages deploy orderking-riders/dist --project-name=orderking-riders --branch=main --commit-dirty=true
        } -MaxRetries 3

        Invoke-CheckedStep "[4/5] Deploying HDmaster -> admin.orderkingpay.com & hdmaster.pages.dev" {
            & $nodeExe $wranglerJs pages deploy HDmaster/dist --project-name=orderking-hdmaster --branch=main --commit-dirty=true
            if ($LASTEXITCODE -eq 0) {
                & $nodeExe $wranglerJs pages deploy HDmaster/dist --project-name=hdmaster --branch=main --commit-dirty=true
            }
        } -MaxRetries 3

        $appsIntegrationDir = $null
        foreach ($cand in @("apps-integration", "Apps-integration", "Apps-integration-")) {
            if (Test-Path "$cand/dist") {
                $appsIntegrationDir = "$cand/dist"
                break
            }
        }

        if ($appsIntegrationDir) {
            Invoke-CheckedStep "[5/5] Deploying Apps-integration -> api.orderkingpay.com" {
                & $nodeExe $wranglerJs pages deploy $appsIntegrationDir --project-name=apps-integration --branch=main --commit-dirty=true
            } -MaxRetries 3
        } else {
            Write-Host "`n[5/5] Apps-integration local build not detected; skipping edge upload for api.orderkingpay.com." -ForegroundColor Yellow
        }

        Write-Host "`n==========================================================" -ForegroundColor Green
        Write-Host " All Production Platforms Successfully Deployed Live to Cloudflare!" -ForegroundColor Green
        Write-Host " 1. Customers: https://orderkingpay.com" -ForegroundColor Green
        Write-Host " 2. Partners:  https://partner.orderkingpay.com" -ForegroundColor Green
        Write-Host " 3. Riders:    https://rider.orderkingpay.com" -ForegroundColor Green
        Write-Host " 4. Umar OS:   https://admin.orderkingpay.com" -ForegroundColor Green
        if ($appsIntegrationDir) {
            Write-Host " 5. Core API:  https://api.orderkingpay.com" -ForegroundColor Green
        }
        Write-Host "==========================================================" -ForegroundColor Green
    }
    "build" {
        Invoke-CheckedStep "[1/4] Building HDmaster (Umar OS Command Center)" {
            Push-Location HDmaster
            try { pnpm build } finally { Pop-Location }
        }

        Invoke-CheckedStep "[2/4] Building OrderKing Partners" {
            Push-Location orderking-partners
            try { pnpm build } finally { Pop-Location }
        }

        Invoke-CheckedStep "[3/4] Building OrderKing Riders" {
            Push-Location orderking-riders
            try { pnpm build } finally { Pop-Location }
        }

        Invoke-CheckedStep "[4/4] Building OrderKing Customers" {
            Push-Location orderking-customers
            try { pnpm build } finally { Pop-Location }
        }

        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host " All 4 Platforms Built Successfully!" -ForegroundColor Green
        Write-Host " Launch local server:  .\deploy.ps1 -Action start" -ForegroundColor Yellow
        Write-Host " Deploy to live web:   .\deploy.ps1 -Action deploy" -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Green
    }
    Default {
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " ORDERKING LIVE PRODUCTION STATUS" -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " All 5 websites are DEPLOYED LIVE to Cloudflare Pages:" -ForegroundColor Green
        Write-Host " • Customers (Main App):   https://orderkingpay.com" -ForegroundColor White
        Write-Host "   Preview:                https://orderking-customers.pages.dev" -ForegroundColor Gray
        Write-Host " • Merchant / Partners:    https://partner.orderkingpay.com" -ForegroundColor White
        Write-Host "   Preview:                https://orderking-partners.pages.dev" -ForegroundColor Gray
        Write-Host " • Rider Fleet:            https://rider.orderkingpay.com" -ForegroundColor White
        Write-Host "   Preview:                https://orderking-riders.pages.dev" -ForegroundColor Gray
        Write-Host " • Umar OS Admin Center:   https://admin.orderkingpay.com" -ForegroundColor White
        Write-Host "   Preview:                https://orderking-hdmaster.pages.dev" -ForegroundColor Gray
        Write-Host " • Unified Core API:       https://api.orderkingpay.com" -ForegroundColor White
        Write-Host "   Preview:                https://apps-integration.pages.dev" -ForegroundColor Gray
        Write-Host ""
        Write-Host " Available PowerShell Actions:" -ForegroundColor Yellow
        Write-Host "   .\deploy.ps1 -Action all     -> Test, qualify, build, and deploy live to websites" -ForegroundColor Green
        Write-Host "   .\deploy.ps1 -Action deploy  -> Redeploy all apps live to Cloudflare Pages" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action build   -> Rebuild all 4 production bundles" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action test    -> Run all test suites across the ecosystem" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action start   -> Launch all 4 local preview servers" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action dev     -> Run apps in dev mode" -ForegroundColor Cyan
        Write-Host "==========================================================" -ForegroundColor Cyan
    }
}
