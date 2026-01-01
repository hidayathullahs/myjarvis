@echo off
echo ===================================================
echo       INITIALIZING J.A.R.V.I.S SYSTEM...
echo ===================================================

echo Installing dependencies (if needed)...
call npm run install-all

echo Starting J.A.R.V.I.S (Backend + Frontend)...
npm start

pause
