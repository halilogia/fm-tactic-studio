@echo off
title FM Tactic Studio
cd /d "%~dp0"

echo ========================================================
echo       FM TACTIC STUDIO (Masaüstü Uygulaması)
echo ========================================================

netstat -ano | findstr ":8765" | findstr "LISTENING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [BILGI] Yerel sunucu arka planda baslatiliyor...
    start /b python app.py
    timeout /t 2 >nul
)

if exist "node_modules\electron\dist\electron.exe" (
    "node_modules\electron\dist\electron.exe" .
) else (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:8765" --window-size=1360,840
)
