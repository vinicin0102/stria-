@echo off
echo Iniciando STRIAÉ Funnel...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Instalando dependências...
    call npm install
    echo.
)

REM Display important info
echo ============================================
echo  STRIAÉ Sales Funnel - Dev Server
echo ============================================
echo.
echo Iniciando servidor em http://localhost:3000
echo.
echo Pressione CTRL+C para parar o servidor
echo.
echo ============================================
echo.

REM Start dev server
call npm run dev

pause
