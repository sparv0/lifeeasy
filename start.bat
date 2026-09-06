@echo off
echo Starting OmniConvert Application...
echo.

REM Start Backend
echo [1/3] Starting Python Backend Server...
cd "%~dp0backend"
start "OmniConvert Backend" cmd /k ".\venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

REM Start Frontend
echo [2/3] Starting React Frontend Server...
cd "%~dp0frontend"
start "OmniConvert Frontend" cmd /k "npm run dev"

REM Wait a moment for servers to spin up
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak > nul

REM Open Browser
echo Opening Browser...
start http://localhost:5173

echo Done! You can close this window now.
