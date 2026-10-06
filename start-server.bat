@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Ticket Tracker Launcher

echo ============================================
echo   Ticket Tracker - launcher
echo ============================================
echo.

rem ------------------------------------------------------------
rem 1. Node.js 18+ (installed through winget if missing)
rem ------------------------------------------------------------
call :check_node
if not errorlevel 1 goto :deps_check

echo [setup] Node.js 18 or newer was not found.
call :install_node
call :check_node
if errorlevel 1 goto :node_failed

rem ------------------------------------------------------------
rem 2. npm dependencies (including nodemon) and native module
rem ------------------------------------------------------------
:deps_check
if not exist "node_modules\nodemon\package.json" goto :install_deps
if not exist "node_modules\better-sqlite3\package.json" goto :install_deps
goto :native_check

:install_deps
echo [setup] Installing dependencies - this needs internet access...
call npm install
if errorlevel 1 goto :npm_failed

:native_check
node -e "new (require('better-sqlite3'))(':memory:').close()" >nul 2>&1
if not errorlevel 1 goto :env_check
echo [setup] Rebuilding the database module for this machine...
call npm rebuild better-sqlite3
node -e "new (require('better-sqlite3'))(':memory:').close()" >nul 2>&1
if errorlevel 1 goto :npm_failed

rem ------------------------------------------------------------
rem 3. .env configuration (created from prompts if missing)
rem ------------------------------------------------------------
:env_check
if exist ".env" goto :read_port
echo.
echo [setup] No .env file found. Enter your Azure DevOps details to create one.
echo         The token needs read access to Work Items. Its input is hidden.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$org = Read-Host 'Azure DevOps organization'; $proj = Read-Host 'Azure DevOps project'; $sec = Read-Host 'Personal Access Token' -AsSecureString; $pat = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)); if (-not $org -or -not $proj -or -not $pat) { exit 1 }; $lines = @('# Azure DevOps Configuration', ('ADO_ORG=' + $org.Trim()), ('ADO_PROJECT=' + $proj.Trim()), ('ADO_PAT=' + $pat.Trim()), '', '# Polling interval in milliseconds', 'POLL_INTERVAL_MS=3600000', '', '# Server port', 'PORT=3000'); Set-Content -Path '.env' -Value $lines -Encoding ascii"
if not exist ".env" goto :env_failed
echo [setup] .env created.

rem ------------------------------------------------------------
rem 4. Port, and whether the app is already running
rem ------------------------------------------------------------
:read_port
set "PORT=3000"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /b /i /c:"PORT=" ".env"`) do set "PORT=%%b"
set "PORT=%PORT: =%"

netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if errorlevel 1 goto :start_server
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://localhost:%PORT%/api/tickets; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto :port_busy
echo [info] Ticket Tracker is already running. Opening it in your browser.
start "" http://localhost:%PORT%
exit /b 0

rem ------------------------------------------------------------
rem 5. Start the server and open the browser once it is up
rem ------------------------------------------------------------
:start_server
echo [start] Starting the server...
start "Ticket Tracker Server" cmd /k "npm run dev"

set /a TRIES=0
:wait_loop
set /a TRIES+=1
if %TRIES% GTR 45 goto :start_timeout
ping -n 2 127.0.0.1 >nul
powershell -NoProfile -Command "try { (New-Object Net.Sockets.TcpClient).Connect('localhost', %PORT%) } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto :wait_loop

echo [start] Server is up. Opening http://localhost:%PORT%
start "" http://localhost:%PORT%
exit /b 0

rem ------------------------------------------------------------
rem Subroutines
rem ------------------------------------------------------------
:check_node
set "NODE_MAJOR="
where node >nul 2>&1
if errorlevel 1 exit /b 1
for /f %%v in ('node -p "parseInt(process.versions.node)"') do set "NODE_MAJOR=%%v"
if not defined NODE_MAJOR exit /b 1
if %NODE_MAJOR% LSS 18 exit /b 1
exit /b 0

:install_node
where winget >nul 2>&1
if errorlevel 1 exit /b 1
echo [setup] Installing Node.js LTS with winget. Approve any prompt that appears...
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
exit /b 0

rem ------------------------------------------------------------
rem Error exits
rem ------------------------------------------------------------
:node_failed
echo.
echo [error] Node.js 18 or newer is required and could not be installed automatically.
echo         Install Node.js LTS from https://nodejs.org, then run this file again.
echo         If you just installed it, close this window and run this file again.
pause
exit /b 1

:npm_failed
echo.
echo [error] Installing dependencies failed. Check your internet connection and the messages above,
echo         then run this file again.
pause
exit /b 1

:env_failed
echo.
echo [error] The .env file was not created. All three values are required.
echo         Run this file again to retry.
pause
exit /b 1

:port_busy
echo.
echo [error] Port %PORT% is already in use by another program.
echo         Close that program, or change PORT in the .env file, then run this file again.
pause
exit /b 1

:start_timeout
echo.
echo [error] The server did not start within 45 seconds.
echo         Check the "Ticket Tracker Server" window for the error message.
pause
exit /b 1
