@echo off
chcp 65001 >nul
title Aurea Clinic & Spa - System & Fixed Ngrok Bridge
color 0A

:: Ensure script runs from its directory
cd /d "%~dp0"

echo ========================================================
echo     AUREA CLINIC & SPA - SYSTEM & FIXED NGROK BRIDGE
echo ========================================================
echo.

:: 1. Start Backend Server in a new dedicated terminal
echo [1/5] Starting Backend Server (Port 5000)...
start "Aurea Clinic - Backend (Port 5000)" cmd /k "cd /d "%~dp0" && title Aurea Clinic - Backend && node server.js"

:: 2. Wait for backend to spin up
echo [2/5] Waiting for backend to spin up (4 seconds)...
timeout /t 4 /nobreak >nul

:: 3. Send WhatsApp bot initialization curl request
echo [3/5] Initializing WhatsApp Bot & Cron Reminders...
curl -s -X POST http://localhost:5000/api/whatsapp/init
echo.

:: 4. Start Frontend Vite Server in a new dedicated terminal
echo [4/5] Starting Frontend Vite Server (Port 5173)...
start "Aurea Clinic - Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && title Aurea Clinic - Frontend && npm run dev"

:: 5. Start Fixed Ngrok Bridge Tunnel in a new dedicated terminal
echo [5/5] Launching Fixed Ngrok Bridge Tunnel...
start "Aurea Clinic - Fixed Ngrok Bridge" cmd /k "cd /d "%~dp0" && title Aurea Clinic - Fixed Ngrok Tunnel && node scripts/start-ngrok.js"

:: Wait 3 seconds
timeout /t 3 /nobreak >nul

:: 6. Open Default Web Browser
echo Launching Clinic Dashboard in your default browser...
start http://localhost:5173

echo.
echo ========================================================
echo   [SUCCESS] Clinic System & Fixed Ngrok Bridge Running!
echo   * Local App:     http://localhost:5173
echo   * Local Backend: http://localhost:5000
echo ========================================================
echo.
timeout /t 4 >nul
exit
