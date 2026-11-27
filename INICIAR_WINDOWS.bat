@echo off
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
    py -3 iniciar.py
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo Necesitas Python 3 instalado y disponible en PATH.
        echo Revisa LEEME_PRIMERO.txt.
        pause
        exit /b 1
    )
    python iniciar.py
)
pause
