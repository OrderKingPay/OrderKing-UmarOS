@echo off
echo Starting all 4 OrderKing Production Preview Servers...

start "OrderKing HQ / UmarOS (Port 8081)" cmd /k "cd /d c:\Users\hasan\OrderKing\HDmaster && pnpm preview"
start "OrderKing Customers (Port 8082)" cmd /k "cd /d c:\Users\hasan\OrderKing\orderking-customers && pnpm preview"
start "OrderKing Riders (Port 8083)" cmd /k "cd /d c:\Users\hasan\OrderKing\orderking-riders && pnpm preview"
start "OrderKing Partners (Port 8084)" cmd /k "cd /d c:\Users\hasan\OrderKing\orderking-partners && pnpm preview"

echo.
echo ========================================================
echo ALL 4 PREVIEW SERVERS STARTED:
echo ========================================================
echo UmarOS (Executive HQ):               http://localhost:8081
echo Customer OS (Food & King Pay):       http://localhost:8082
echo Rider OS (Delivery Fleet):           http://localhost:8083
echo Partners OS (Kitchen / Merchant):    http://localhost:8084
echo ========================================================
echo.
pause
