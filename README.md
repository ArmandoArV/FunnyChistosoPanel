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
```powershell
cd backend
go mod download
go run main.go
```

**Terminal 2: Frontend**
```powershell
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

### Docker

```powershell
docker-compose up -d
```

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
