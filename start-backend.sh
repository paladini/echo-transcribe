#!/bin/bash

# EchoTranscribe Backend Startup Script
# This script should be run before starting the Tauri application

echo "Starting EchoTranscribe Backend..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/update dependencies
echo "Installing Python dependencies..."
pip install -r src-tauri/backend/requirements.txt

# Start the backend server
echo "Starting backend server on http://localhost:8000"
cd src-tauri/backend
python main.py
