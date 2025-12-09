@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     GENERADOR DE SERIALES - SISTEMA FARMACIA PORTABLE      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Usa este programa para generar seriales de activación
echo para tus clientes basándose en su HWID único.
echo.
echo ══════════════════════════════════════════════════════════════
echo.

set /p hwid="Ingresa el HWID del cliente: "

if "%hwid%"=="" (
    echo.
    echo [ERROR] El HWID no puede estar vacío
    pause
    exit /b 1
)

echo.
echo Generando serial...
echo.

python generate_serial.py %hwid%

echo.
pause
