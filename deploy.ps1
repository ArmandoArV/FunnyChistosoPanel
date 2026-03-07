#!/usr/bin/env pwsh
# C2 Backend Deployment Script
# Usage: .\deploy.ps1 [-ShowCredentials]

param(
    [string]$VMUser = "azureuser",
    [string]$VMHost = "20.42.15.210",
    [string]$RemotePath = "~/c2-panel",
    [switch]$ShowCredentials  # Add this flag to see startup logs and credentials
)

$ErrorActionPreference = "Stop"

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  C2 Backend Deployment Pipeline" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build locally
Write-Host "[1/5] Building backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

go build -ldflags="-s -w" -o c2server-linux .

if (-not (Test-Path "c2server-linux")) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful ($(((Get-Item c2server-linux).Length / 1MB).ToString('0.00')) MB)" -ForegroundColor Green

# Step 2: Upload binary
Write-Host "`n[2/5] Uploading to VM..." -ForegroundColor Yellow
scp c2server-linux "${VMUser}@${VMHost}:${RemotePath}/c2server-new"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Upload complete" -ForegroundColor Green

# Step 3: Stop old server
Write-Host "`n[3/5] Stopping old server..." -ForegroundColor Yellow
ssh "${VMUser}@${VMHost}" "killall c2server 2>/dev/null || true"
Start-Sleep -Seconds 2
Write-Host "✓ Old server stopped" -ForegroundColor Green

# Step 4: Replace binary
Write-Host "`n[4/5] Replacing binary..." -ForegroundColor Yellow
ssh "${VMUser}@${VMHost}" "cd ${RemotePath} && mv c2server-new c2server && chmod +x c2server"
Write-Host "✓ Binary replaced" -ForegroundColor Green

# Step 5: Start new server
Write-Host "`n[5/5] Starting new server..." -ForegroundColor Yellow

if ($ShowCredentials) {
    Write-Host "✓ Deleting database to generate new credentials..." -ForegroundColor Cyan
    ssh "${VMUser}@${VMHost}" "cd ${RemotePath} && rm -rf data"
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host "  MANUAL START REQUIRED" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command to see admin credentials:" -ForegroundColor White
    Write-Host ""
    Write-Host "  ssh ${VMUser}@${VMHost} `"cd ${RemotePath} && ./c2server`"" -ForegroundColor Green
    Write-Host ""
    Write-Host "Watch for:" -ForegroundColor Cyan
    Write-Host "  🔐 ADMIN CREDENTIALS" -ForegroundColor Yellow
    Write-Host "  Username: admin" -ForegroundColor Gray
    Write-Host "  Password: <16-char random>" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After copying the password, press Ctrl+C and run:" -ForegroundColor White
    Write-Host ""
    Write-Host "  ssh ${VMUser}@${VMHost} `"cd ${RemotePath} && nohup ./c2server > c2server.log 2>&1 &`"" -ForegroundColor Green
    Write-Host ""
    exit 0
}

ssh "${VMUser}@${VMHost}" "cd ${RemotePath} && nohup ./c2server > c2server.log 2>&1 & sleep 2 && ps aux | grep '[c]2server'"
Write-Host "✓ Server started" -ForegroundColor Green

# Step 6: Health check
Write-Host "`n[✓] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$health = curl -s http://${VMHost}:8080/health 2>$null
if ($health -match "ok") {
    Write-Host "✓ Health check passed: $health" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Health check failed" -ForegroundColor Yellow
}

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  • C2 Server:  20.42.15.210:4444" -ForegroundColor Gray
Write-Host "  • API:        20.42.15.210:8080" -ForegroundColor Gray
Write-Host "  • Tunnel:     https://controversial-validity-striking-kits.trycloudflare.com" -ForegroundColor Gray
Write-Host "  • Dashboard:  https://funnychistoso-panel.vercel.app" -ForegroundColor Gray
Write-Host ""
