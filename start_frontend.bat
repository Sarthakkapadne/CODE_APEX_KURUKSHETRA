@echo off
echo ===================================================
echo   Starting LexPort Next.js Web Frontend
echo   Port: 3000 (http://localhost:3000)
echo ===================================================
cd /d "%~dp0frontend"
npm run dev
pause
