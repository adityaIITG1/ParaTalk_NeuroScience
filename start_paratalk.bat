@echo off
title ParaTalk Server
echo =========================================
echo Starting ParaTalk EOG System...
echo Please leave this window open while using the app!
echo =========================================
cd /d "c:\Users\ASUS\OneDrive\Desktop\Para_Talk"

:: Schedule the browser to open automatically after 5 seconds in the background
start /B cmd /c "ping localhost -n 6 > nul && start http://localhost:3000"

:: Start the server in this exact same window so we don't open two command prompts
npm run dev
