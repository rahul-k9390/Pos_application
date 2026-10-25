@echo off
title Kirana & Retail POS System
color 0A
echo ========================================================
echo   Starting Kirana & Retail POS System...
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend API Server & Frontend Client...
start /b cmd /c "npm run dev"

echo [2/3] Waiting for servers to initialize...
timeout /t 3 /nobreak > nul

echo [3/3] Opening POS Register in your browser...
start "" "http://localhost:3000"

echo.
echo ========================================================
echo   POS System is RUNNING on http://localhost:3000
echo   Minimize this window, do not close it while shop is open.
echo ========================================================
echo.
pause
