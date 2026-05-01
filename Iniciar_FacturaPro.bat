@echo off
color 0A
echo ==================================================
echo   INICIANDO ECOSISTEMA FACTURAPRO (CFDI 4.0)
echo ==================================================
echo.
echo [1/2] Encendiendo Motor Backend en puerto 3005...
start "FacturaPro Backend" cmd /k "cd backend && npm run start:dev"

timeout /t 3 /nobreak > NUL

echo [2/2] Encendiendo Vista UI en puerto 3004...
start "FacturaPro Frontend" cmd /k "cd frontend && npm run dev -- -p 3004"

echo.
echo ==================================================
echo Operacion Exitosa. Revisa las dos ventanas abiertas.
echo Puedes cerrar esta.
echo ==================================================
timeout /t 5 > NUL
