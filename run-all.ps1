Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting The Astral Cartographer Services" -ForegroundColor Cyan
Write-Host "  Webster 2026 - Team 262: DeDevelopers" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/3] Starting Analyzer Engine on port 5050..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\analyzer'; npm run serve"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Backend GitHub Service on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\github-service'; npm start"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Frontend Dashboard on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend\astral-frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`nAll services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "Analyzer: http://localhost:5050" -ForegroundColor Green

Start-Process "http://localhost:5173"
