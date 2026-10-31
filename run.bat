@echo off
chcp 65001 >nul
title FM Tactic Studio
cd /d "%~dp0"

echo ========================================================
echo       FM TACTIC STUDIO (Masaustu Uygulamasi)
echo ========================================================

netstat -ano | findstr ":8765" | findstr "LISTENING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [BILGI] Yerel sunucu arka planda baslatiliyor...
    start /b python app.py
    for /L %%i in (1,1,15) do (
        netstat -ano | findstr ":8765" | findstr "LISTENING" >nul
        if not errorlevel 1 goto :server_ready
        timeout /t 1 /nobreak >nul
    )
)
:server_ready

if exist "node_modules\electron\dist\electron.exe" (
    "node_modules\electron\dist\electron.exe" .
) else (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:8765" --window-size=1360,840
)
