@echo off
rem Abre o Mini Fazenda no navegador para teste local (sem login, sem salvar na conta).
cd /d "%~dp0"
echo.
echo  Mini Fazenda - teste local
echo  Deixe esta janela aberta enquanto testa. Para parar, feche esta janela.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080/teste-local.html"

where py >nul 2>nul
if %errorlevel%==0 ( py -m http.server 8080 & goto :fim )

python --version >nul 2>nul
if %errorlevel%==0 ( python -m http.server 8080 & goto :fim )

where npx >nul 2>nul
if %errorlevel%==0 ( npx --yes http-server -p 8080 -c-1 & goto :fim )

echo  Nao encontrei Python nem Node.js neste computador.
echo  Instale o Python em https://www.python.org/downloads/ (marque "Add python.exe to PATH")
echo  e depois de instalar, de dois cliques neste arquivo de novo.
pause
:fim
