@echo off
echo Stopping active node processes to release folder locks...
taskkill /F /IM node.exe /T

echo Renaming root directories...
rename "C:\Users\hasan\OrderKing\roshoi-customers--orders-" "orderking-customers--orders-"
rename "C:\Users\hasan\OrderKing\Roshoi-partners" "OrderKing-partners"
rename "C:\Users\hasan\OrderKing\roshoi-riders" "orderking-riders"

echo All folders renamed successfully.
echo You can now restart your dev servers!
pause
