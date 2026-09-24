@echo off
echo Starting all OrderKing apps for local browser testing...

start cmd /k "title HDmaster (AI Dashboard) && cd HDmaster && npx vite dev --port 8081"
start cmd /k "title Customer App && cd orderking-customers && npx vite dev --port 8082"
start cmd /k "title Rider App && cd orderking-riders && npx vite dev --port 8083"
start cmd /k "title Partners App && cd orderking-partners && npx vite dev --port 8084"
start cmd /k "title Integration App && cd Apps-integration- && npx vite dev --port 8085"

echo.
echo ========================================================
echo ALL APPS STARTING. CLICK THE LINKS BELOW TO OPEN:
echo ========================================================
echo HDMaster AI Dashboard: http://localhost:8081
echo Customer App:          http://localhost:8082
echo Rider App:             http://localhost:8083
echo Partners App:          http://localhost:8084
echo Integration App:       http://localhost:8085
echo ========================================================
echo.
pause
