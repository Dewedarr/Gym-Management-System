@echo off
chcp 65001 > nul
echo ==========================================
echo   GymPro - تشغيل Frontend (React)
echo ==========================================
echo.
cd /d "%~dp0gym-frontend"

echo [1] تثبيت الباكدجز...
npm install

echo.
echo [2] تشغيل React على http://localhost:3000
echo.
npm run dev
pause
