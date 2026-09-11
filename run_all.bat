@echo off
echo ========================================================
echo   Launching LexPort Agentic Compliance Co-Pilot System
echo   Backend: http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo ========================================================
start "LexPort Backend API" cmd /k "start_backend.bat"
timeout /t 3 /nobreak >nul
start "LexPort Web Dashboard" cmd /k "start_frontend.bat"
echo Services launched.
