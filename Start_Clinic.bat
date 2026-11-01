@echo off
chcp 65001 >nul
title Aurea Clinic & Spa - System Launcher
color 0A

:: Ensure script runs from its directory
cd /d "%~dp0"

echo ========================================================
echo        AUREA CLINIC & SPA - SYSTEM LAUNCHER
echo ========================================================
echo.

:: 1. Start Backend Server in a new dedicated terminal
echo [1/4] Starting Backend Server (Port 5000)...
start "Aurea Clinic - Backend (Port 5000)" cmd /k "cd /d "%~dp0" && title Aurea Clinic - Backend && node server.js"

:: 2. Wait for backend to be ready
echo [2/4] Waiting for backend to spin up (5 seconds)...
timeout /t 5 /nobreak >nul

:: 3. Send WhatsApp bot initialization curl request
echo [3/4] Initializing WhatsApp Bot & Cron Reminders...
curl -s -X POST http://localhost:5000/api/whatsapp/init
echo.

:: 4. Start Frontend Vite Server in a new dedicated terminal
echo [4/4] Starting Frontend Vite Server (Port 5173)...
start "Aurea Clinic - Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && title Aurea Clinic - Frontend && npm run dev"

:: Wait 3 seconds for Vite server to boot up
timeout /t 3 /nobreak >nul

:: 5. Open Default Web Browser to the Clinic Dashboard
echo Launching Clinic Dashboard in your default browser...
start http://localhost:5173

echo.
echo ========================================================
echo   [SUCCESS] Clinic System is now running!
echo   * Backend:  http://localhost:5000
echo   * Frontend: http://localhost:5173
echo   (Keep the opened terminal windows open while working)
echo ========================================================
echo.
timeout /t 4 >nul
exit
