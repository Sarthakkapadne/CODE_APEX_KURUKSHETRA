@echo off
setlocal enabledelayedexpansion
echo ===================================================
echo   Starting LexPort Compliance Co-Pilot Backend API
echo   FastAPI + SQLite + Three-Tier Multi-Agent Engine
echo ===================================================

cd /d "%~dp0"

REM 1. Check for workspace root virtual environment
if exist "..\..\.venv\Scripts\python.exe" (
    echo [LAUNCHER] Using workspace virtual environment: ..\..\.venv\Scripts\python.exe
    "..\..\.venv\Scripts\python.exe" -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
    goto end
)

REM 2. Check for local .venv
if exist ".venv\Scripts\python.exe" (
    echo [LAUNCHER] Using local virtual environment: .venv\Scripts\python.exe
    ".venv\Scripts\python.exe" -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
    goto end
)

REM 3. Fallback to standard python interpreter
echo [LAUNCHER] Using system python interpreter...
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload

:end
pause

