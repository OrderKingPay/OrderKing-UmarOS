# ==============================================================================
# 👑 ORDERKINGPAY — START / RESTART ALL PREVIEW SERVERS
# ==============================================================================
# Delegates to RESTART_ORDERKING_CLEAN.ps1 for zero-stale-port clean launch
$cleanScript = "C:\Users\hasan\OrderKing\RESTART_ORDERKING_CLEAN.ps1"
if (Test-Path $cleanScript) {
    & $cleanScript
} else {
    Write-Host "Starting OrderKing Production Preview Servers..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\HDmaster; pnpm preview"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\orderking-customers; pnpm preview"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\orderking-riders; pnpm preview"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\orderking-partners; pnpm preview"
}
