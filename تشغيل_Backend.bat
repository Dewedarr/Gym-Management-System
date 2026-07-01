@echo off
chcp 65001 > nul
echo ==========================================
echo   GymPro - تشغيل Backend (.NET API)
echo ==========================================
echo.
cd /d "%~dp0GymSystem.API"

echo [1] تثبيت الباكدجز...
dotnet restore

echo.
echo [2] عمل Migration للداتابيز...
dotnet ef migrations add InitialCreate --project . 2>nul || echo "Migration موجود بالفعل"
dotnet ef database update

echo.
echo [3] تشغيل السيرفر على http://localhost:5000
echo     Swagger UI: http://localhost:5000/swagger
echo.
dotnet run --urls "http://localhost:5000"
pause
