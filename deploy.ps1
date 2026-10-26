# OrderKing Unified Enterprise Deployment Script (PowerShell)
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

# Find Node executable
$nodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
}

switch ($Action.ToLower()) {
    "start" {
        Write-Host "Starting OrderKing Unified Gateway..." -ForegroundColor Cyan
        & $nodeExe server.js
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

        Write-Host "`n[1/5] Deploying orderking-customers -> orderkingpay.com..." -ForegroundColor Cyan
        & $nodeExe $wranglerJs pages deploy orderking-customers/dist --project-name=orderking-customers --branch=main --commit-dirty=true

        Write-Host "`n[2/5] Deploying orderking-partners -> partner.orderkingpay.com..." -ForegroundColor Cyan
        & $nodeExe $wranglerJs pages deploy orderking-partners/dist --project-name=orderking-partners --branch=main --commit-dirty=true

        Write-Host "`n[3/5] Deploying orderking-riders -> rider.orderkingpay.com..." -ForegroundColor Cyan
        & $nodeExe $wranglerJs pages deploy orderking-riders/dist --project-name=orderking-riders --branch=main --commit-dirty=true

        Write-Host "`n[4/4] Deploying HDmaster -> admin.orderkingpay.com & hdmaster.pages.dev..." -ForegroundColor Cyan
        & $nodeExe $wranglerJs pages deploy HDmaster/dist --project-name=orderking-hdmaster --branch=main --commit-dirty=true
        & $nodeExe $wranglerJs pages deploy HDmaster/dist --project-name=hdmaster --branch=main --commit-dirty=true

        if (Test-Path "Apps-integration-/dist") {
            Write-Host "`n[5/5] Deploying Apps-integration -> api.orderkingpay.com..." -ForegroundColor Cyan
            & $nodeExe $wranglerJs pages deploy Apps-integration-/dist --project-name=apps-integration --branch=main --commit-dirty=true
        }

        Write-Host "`n==========================================================" -ForegroundColor Green
        Write-Host " All Production Platforms Successfully Deployed Live to Cloudflare!" -ForegroundColor Green
        Write-Host " 1. Customers: https://orderkingpay.com" -ForegroundColor Green
        Write-Host " 2. Partners:  https://partner.orderkingpay.com" -ForegroundColor Green
        Write-Host " 3. Riders:    https://rider.orderkingpay.com" -ForegroundColor Green
        Write-Host " 4. Umar OS:   https://admin.orderkingpay.com" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
    }
    "build" {
        Write-Host "[1/4] Building HDmaster (Command Center)..." -ForegroundColor Cyan
        Push-Location HDmaster
        pnpm build
        Pop-Location

        Write-Host "[2/4] Building OrderKing Partners..." -ForegroundColor Cyan
        Push-Location orderking-partners
        pnpm build
        Pop-Location

        Write-Host "[3/4] Building OrderKing Riders..." -ForegroundColor Cyan
        Push-Location orderking-riders
        pnpm build
        Pop-Location

        Write-Host "[4/4] Building OrderKing Customers..." -ForegroundColor Cyan
        Push-Location orderking-customers
        pnpm build
        Pop-Location

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
        Write-Host "   .\deploy.ps1 -Action deploy  -> Redeploy all 5 apps to Cloudflare" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action build   -> Rebuild all apps sequentially" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action start   -> Run local unified gateway (node server.js)" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action build   -> Rebuild all 4 production bundles" -ForegroundColor Cyan
        Write-Host "   .\deploy.ps1 -Action dev     -> Run all apps in dev mode" -ForegroundColor Cyan
        Write-Host "==========================================================" -ForegroundColor Cyan
    }
}
