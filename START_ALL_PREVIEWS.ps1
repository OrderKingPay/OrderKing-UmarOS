# Launch all 4 OrderKing Production Preview Servers in separate background processes
Write-Host "Starting OrderKing Production Preview Servers..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\HDmaster; pnpm preview"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\orderking-customers; pnpm preview"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\orderking-riders; pnpm preview"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\hasan\OrderKing\orderking-partners; pnpm preview"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ALL 4 ORDERKING PRODUCTION PREVIEW SERVERS ARE LIVE:" -ForegroundColor Green
Write-Host "  1. UmarOS (HQ):    http://localhost:8081" -ForegroundColor Yellow
Write-Host "  2. Customer OS:    http://localhost:8082" -ForegroundColor Yellow
Write-Host "  3. Rider OS:       http://localhost:8083" -ForegroundColor Yellow
Write-Host "  4. Partners OS:    http://localhost:8084" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
