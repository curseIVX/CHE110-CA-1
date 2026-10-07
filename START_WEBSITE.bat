@echo off
title SolarScope India
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed.
  echo Opening the offline version instead...
  start "" "%~dp0SolarScope_India_ULTRA_OFFLINE.html"
  pause
  exit /b
)
start "SolarScope Backend" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 2 /nobreak >nul
start "" http://localhost:3000
echo SolarScope India started at http://localhost:3000
exit
