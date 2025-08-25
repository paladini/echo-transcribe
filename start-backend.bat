@echo off
REM EchoTranscribe Backend Startup Script for Windows
REM This script should be run before starting the Tauri application

echo Starting EchoTranscribe Backend...

REM Navigate to project directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv" (
    echo Virtual environment not found. Creating one...
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing Python dependencies...
pip install -r src-tauri\backend\requirements.txt

REM Start the backend server
echo Starting backend server on http://localhost:8000
cd src-tauri\backend
python main.py
