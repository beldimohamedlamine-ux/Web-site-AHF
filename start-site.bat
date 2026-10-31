@echo off
title AHF Website - Local Web Server
cd /d "%~dp0"

echo ===================================================
echo   AHF Website - Local Web Server
echo ===================================================
echo.
echo Starting server at http://localhost:8080 ...
echo Close this window or press Ctrl+C anytime to stop.
echo.

:: Open default browser
start http://localhost:8080

:: Run the Python HTTP server
python -m http.server 8080

pause
