# C2 Control Panel Repository Setup Script (Windows)
# This script creates the complete directory structure for your new repository

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "C2 Control Panel Repository Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$REPO_NAME = if ($args[0]) { $args[0] } else { "c2-control-panel" }

Write-Host "[*] Creating repository: $REPO_NAME" -ForegroundColor Yellow

# Create main directory
New-Item -ItemType Directory -Path $REPO_NAME -Force | Out-Null
Set-Location $REPO_NAME

Write-Host "[✓] Created main directory" -ForegroundColor Green

# Backend structure
Write-Host "[*] Creating backend structure..." -ForegroundColor Yellow
$backendDirs = @(
    "backend\c2server",
    "backend\api",
    "backend\websocket",
    "backend\database",
    "backend\models",
    "data"
)
foreach ($dir in $backendDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Frontend structure
Write-Host "[*] Creating frontend structure..." -ForegroundColor Yellow
$frontendDirs = @(
    "frontend\app",
    "frontend\app\api",
    "frontend\components",
    "frontend\lib",
    "frontend\public"
)
foreach ($dir in $frontendDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Docs
New-Item -ItemType Directory -Path "docs" -Force | Out-Null

Write-Host "[✓] Directory structure created" -ForegroundColor Green

# Create README with instructions
Write-Host "[*] Creating README.md..." -ForegroundColor Yellow
@"
# C2 Control Panel

High-performance Command & Control server with modern web dashboard.

## Tech Stack

- **Backend:** Golang (binary protocol, TCP server, REST API)
- **Frontend:** Next.js 14 (React, TypeScript, Tailwind CSS)
- **Database:** SQLite
- **Real-time:** WebSocket

## Quick Start

### Local Development

**Terminal 1: Backend**
``````powershell
cd backend
go mod download
go run main.go
``````

**Terminal 2: Frontend**
``````powershell
cd frontend
npm install
npm run dev
``````

Visit: http://localhost:3000

### Docker

``````powershell
docker-compose up -d
``````

## Features

- ✅ Multi-victim management
- ✅ Real-time shell execution
- ✅ WebSocket notifications
- ✅ Modern responsive UI
- 🔲 Screen streaming (coming soon)
- 🔲 File manager (coming soon)
- 🔲 Process manager (coming soon)

## Setup Instructions

1. **Copy all code files from C2_SERVER_CODE_COMPLETE.md** into their respective locations
2. **Initialize Git repository**
3. **Test locally** (see Quick Start above)
4. **Push to GitHub**
5. **Deploy to production**

See full documentation at: https://github.com/YourUsername/NonSoEthicalStuff

## Security

⚠️ **Educational purposes only**. Unauthorized access is illegal.

## License

MIT
"@ | Out-File -FilePath "README.md" -Encoding UTF8

# Create .gitignore
Write-Host "[*] Creating .gitignore..." -ForegroundColor Yellow
@"
# Environment
.env
.env.local

# Database
data/
*.db

# Backend
backend/c2server
backend/*.exe

# Frontend
frontend/.next/
frontend/node_modules/
frontend/out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

# Create .env.example
Write-Host "[*] Creating .env.example..." -ForegroundColor Yellow
@"
# Backend
C2_PORT=4444
API_PORT=8080
JWT_SECRET=change-this-secret-key-in-production
DATABASE_PATH=./data/c2.db

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
"@ | Out-File -FilePath ".env.example" -Encoding UTF8

Write-Host ""
Write-Host "✅ Repository structure created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Created repository: $REPO_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Directory Structure:" -ForegroundColor Cyan
Get-ChildItem -Directory -Recurse -Depth 1 | Select-Object FullName

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copy all code from C2_SERVER_CODE_COMPLETE.md into respective files" -ForegroundColor White
Write-Host "   (See the file for complete backend and frontend code)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Initialize Git:" -ForegroundColor White
Write-Host "   git init" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Initial commit: C2 Control Panel'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create GitHub repository and push:" -ForegroundColor White
Write-Host "   gh repo create $REPO_NAME --public" -ForegroundColor Gray
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test locally:" -ForegroundColor White
Write-Host "   # Terminal 1:" -ForegroundColor Gray
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   go run main.go" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Terminal 2:" -ForegroundColor Gray
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Deploy to production (Azure VM):" -ForegroundColor White
Write-Host "   ssh azureuser@YOUR_IP" -ForegroundColor Gray
Write-Host "   git clone https://github.com/YOUR_USERNAME/$REPO_NAME" -ForegroundColor Gray
Write-Host "   cd $REPO_NAME" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "📄 Reference Files:" -ForegroundColor Cyan
Write-Host "   - C2_SERVER_REPO_GUIDE.md (complete documentation)" -ForegroundColor White
Write-Host "   - C2_SERVER_CODE_COMPLETE.md (all source code)" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy hacking!" -ForegroundColor Green
