@echo off
echo =======================================================================
echo     DEK-DRIVSIM CYBERCAFE - COMPILATION COMPLÈTE ET SÉCURISÉE DE L'AGENT
echo =======================================================================
echo.
echo [+] Vérification de l'environnement de développement Windows...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installé ou n'est pas configuré dans le PATH Windows.
    echo Téléchargez et installez Python via https://www.python.org/
    echo N'oubliez pas de cocher la case "Add Python to PATH" lors de l'installation.
    pause
    exit /b 1
)

echo [+] Installation et mise à jour de PyInstaller...
pip install pyinstaller --break-system-packages

echo [+] Compilation de dek_client_agent.py en exécutable Windows (.exe) autonome...
pyinstaller --onefile --noconsole --name "dek_client_agent" --clean dek_client_agent.py

if %errorlevel% equ 0 (
    echo.
    echo =======================================================================
    echo   [SUCCÈS] Exécutable "dek_client_agent.exe" généré avec succès !
    echo   Vous pouvez le récupérer dans le dossier : "dist\dek_client_agent.exe"
    echo =======================================================================
) else (
    echo.
    echo [ERREUR] La compilation a échoué. Veuillez vérifier les logs ci-dessus.
)

pause
