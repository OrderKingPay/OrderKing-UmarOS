@echo off
echo Starting all OrderKing Production Preview Servers...

start "OrderKing Partners (Port 8084)" cmd /k "cd /d c:\Users\hasan\OrderKing\orderking-partners && pnpm preview"
start "OrderKing Riders (Port 8083)" cmd /k "cd /d c:\Users\hasan\OrderKing\orderking-riders && pnpm preview"
start "OrderKing Customers (Port 8082)" cmd /k "cd /d c:\Users\hasan\OrderKing\orderking-customers && pnpm preview"

echo.
echo ========================================================
echo ALL PREVIEW SERVERS STARTED:
echo ========================================================
echo Partners OS (Kitchen / Merchant): http://localhost:8084
echo Rider OS (Delivery Fleet):        http://localhost:8083
echo Customer OS (Food & King Pay):    http://localhost:8082
echo ========================================================
echo.
pause
