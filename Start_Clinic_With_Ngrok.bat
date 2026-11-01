@echo off
chcp 65001 >nul
title Aurea Clinic & Spa - WhatsApp Cloud Bridge
color 0A

:: Ensure script runs from its directory
cd /d "%~dp0"

echo ========================================================
echo     AUREA CLINIC & SPA - WHATSAPP CLOUD BRIDGE
echo ========================================================
echo.

:: 1. Start Backend Server with WhatsApp enabled
echo [1/3] Starting WhatsApp Backend Server (Port 5000)...
start "Aurea Clinic - WhatsApp Bridge" cmd /k "cd /d "%~dp0" && title Aurea Clinic - WhatsApp Bridge && set ENABLE_WHATSAPP=true && node server.js"

:: 2. Wait for backend to spin up
echo [2/3] Waiting for backend to spin up (4 seconds)...
timeout /t 4 /nobreak >nul

:: 3. Initialize WhatsApp Bot
curl -s -X POST http://localhost:5000/api/whatsapp/init >nul

:: 4. Start Fixed Ngrok Bridge Tunnel
echo [3/3] Launching Fixed Ngrok Bridge Tunnel...
start "Aurea Clinic - Fixed Ngrok Tunnel" cmd /k "cd /d "%~dp0" && title Aurea Clinic - Fixed Ngrok Tunnel && node scripts/start-ngrok.js"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 5. Open Online Vercel System
echo.
echo Launching Online Clinic System on Vercel...
start https://aurea-clinic-erp.vercel.app

echo.
echo ========================================================
echo   [SUCCESS] WhatsApp Cloud Bridge is ACTIVE & RUNNING!
echo   * Fixed Bridge URL: https://huntress-pulp-trifle.ngrok-free.dev
echo   * Online System:    https://aurea-clinic-erp.vercel.app
echo.
echo   * تم تشغيل جسر الواتساب فقط لربطه بالنسخة الأونلاين.
echo   * لم يتم تشغيل اللوكال لتوفير موارد الجهاز وسرعة العمل.
echo   (اترك النوافذ الصغيرة مصغرة في شريط المهام طوال اليوم)
echo ========================================================
echo.
timeout /t 4 >nul
exit
