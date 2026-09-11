@echo off
echo ===================================================
echo   Starting LexPort Compliance Co-Pilot Backend API
echo   FastAPI + SQLite + Three-Tier Multi-Agent Engine
echo ===================================================
cd /d "%~dp0"
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
pause
