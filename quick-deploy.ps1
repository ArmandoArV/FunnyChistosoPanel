#!/usr/bin/env pwsh
# Quick Deploy - Upload and Restart Only
# Assumes binary is already built

$VMUser = "azureuser"
$VMHost = "20.42.15.210"
$RemotePath = "~/c2-panel"

Write-Host "`n[1/3] Uploading binary..." -ForegroundColor Cyan
scp D:\FunnyChistosoPanel\backend\c2server-linux "${VMUser}@${VMHost}:${RemotePath}/c2server-new"

Write-Host "`n[2/3] Stopping old server and replacing binary..." -ForegroundColor Cyan
ssh "${VMUser}@${VMHost}" "killall c2server 2>/dev/null || true; cd ${RemotePath} && mv c2server-new c2server && chmod +x c2server"

Write-Host "`n[3/3] Starting new server..." -ForegroundColor Cyan
ssh "${VMUser}@${VMHost}" "cd ${RemotePath} && nohup ./c2server > c2server.log 2>&1 &"

Start-Sleep -Seconds 3

Write-Host "`n[✓] Checking server status..." -ForegroundColor Cyan
ssh "${VMUser}@${VMHost}" "ps aux | grep '[c]2server'"

Write-Host "`nTrying health check..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
curl -s http://${VMHost}:8080/health

Write-Host "`n✓ Deployment complete!" -ForegroundColor Green
Write-Host "Watch logs: ssh ${VMUser}@${VMHost} 'tail -f ${RemotePath}/c2server.log'" -ForegroundColor Gray
