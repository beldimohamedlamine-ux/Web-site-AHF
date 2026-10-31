@echo off
title AHF Website - Stop Local Web Server
cd /d "%~dp0"

echo Stopping any process using port 8080...
powershell -NoProfile -Command "try { $procId = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction Stop).OwningProcess | Select-Object -Unique; Stop-Process -Id $procId -Force; Write-Host 'Server on port 8080 has been stopped.' -ForegroundColor Green } catch { Write-Host 'No active server found on port 8080.' -ForegroundColor Yellow }"

timeout /t 3 >nul
