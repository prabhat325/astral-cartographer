@echo off
echo ========================================================
echo   Starting The Astral Cartographer Services
echo   Webster 2026 - Team 262: DeDevelopers
echo ========================================================

echo [1/3] Starting Analyzer Engine on port 5050...
start "Astral Analyzer Engine (Port 5050)" cmd /k "cd analyzer && npm run serve"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend GitHub Service on port 5000...
start "Astral Backend Service (Port 5000)" cmd /k "cd github-service && npm start"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Dashboard on port 5173...
start "Astral Frontend (Port 5173)" cmd /k "cd frontend\astral-frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   All 3 services launched successfully!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Analyzer: http://localhost:5050
echo ========================================================
start http://localhost:5173
