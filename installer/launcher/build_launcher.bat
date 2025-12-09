@echo off
echo ========================================
echo CONSTRUYENDO LAUNCHER
echo ========================================
echo.

pip install -r requirements.txt

pyinstaller --noconfirm ^
    --onefile ^
    --windowed ^
    --name "FarmaciaLauncher" ^
    --uac-admin ^
    launcher.py

echo.
echo ========================================
echo LAUNCHER CONSTRUIDO EN dist\FarmaciaLauncher.exe
echo ========================================
pause
