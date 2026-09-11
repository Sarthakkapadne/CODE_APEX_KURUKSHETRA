@echo off
echo ===================================================
echo   Starting LexPort Compliance Co-Pilot Backend API
echo   FastAPI + SQLite + Three-Tier Multi-Agent Engine
echo ===================================================
py -3.10 -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
pause
