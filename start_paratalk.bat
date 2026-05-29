@echo off
title ParaTalk EOG System Server
echo =========================================
echo Starting ParaTalk EOG System...
echo =========================================
cd /d "c:\Users\ASUS\OneDrive\Desktop\Para_Talk"

:: Start the Next.js development server in a new window so it keeps running
start "ParaTalk Server" cmd /k "npm run dev"

echo Waiting for the server to initialize...
:: Wait 6 seconds to ensure the server is ready before opening the browser
timeout /t 6 /nobreak > NUL

:: Open the default web browser to the dashboard
echo Opening dashboard...
start http://localhost:3000

exit
