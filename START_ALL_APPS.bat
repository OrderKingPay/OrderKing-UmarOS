@echo off
echo Starting all OrderKing apps for local browser testing...

start cmd /k "title HDmaster (AI Dashboard) && cd HDmaster && npm run dev"
start cmd /k "title Customer App && cd orderking-customers && npm run dev"
start cmd /k "title Rider App && cd orderking-riders && npm run dev"
start cmd /k "title Partners App && cd orderking-partners && npm run dev"
start cmd /k "title Integration App && cd Apps-integration- && npm run dev"

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
