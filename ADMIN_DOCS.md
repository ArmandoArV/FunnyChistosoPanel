# Admin Dashboard & Authentication

## Overview

Added JWT authentication and admin dashboard with deployment controls.

## Features

### 🔐 Authentication System

- **JWT-based authentication** with bcrypt password hashing
- Auto-generated admin credentials on first boot
- Session management with 24-hour token expiration
- Protected routes for secure access

### 🎛️ Admin Dashboard

- **One-click deployment** trigger from web UI
- Real-time deployment logs
- System status monitoring
- User management (change password)

### 🚀 Deployment Integration

- Trigger `deploy.ps1` from web interface
- Live log streaming
- Deploy from GitHub repo (optional)
- Windows PowerShell automation

## Usage

### First Time Setup

1. **Start the backend** (it will generate admin credentials):

   ```bash
   cd backend
   go run .
   ```

2. **Look for output**:

   ```
   =====================================
   🔐 ADMIN CREDENTIALS
   =====================================
   Username: admin
   Password: <randomly-generated-password>
   =====================================
   ⚠️  SAVE THIS PASSWORD - IT WON'T BE SHOWN AGAIN!
   =====================================
   ```

3. **Save the password** - it won't be displayed again!

### Login

1. Navigate to: `http://localhost:3000/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `<your-saved-password>`

### Admin Dashboard

Access at `/admin` after logging in:

- **Deploy Backend**: Click "Deploy Now" to trigger deployment
- **View Logs**: See real-time deployment output
- **System Info**: View all infrastructure endpoints

### Main Dashboard

- Now requires authentication
- Added Admin button in header
- Added Logout button
- Shows current user badge

## API Endpoints

### Authentication

- `POST /api/login` - Login with credentials

  ```json
  {
    "username": "admin",
    "password": "your-password"
  }
  ```

  Returns: `{ "token": "jwt-token", "user": {...} }`

- `GET /api/me` - Get current user (protected)
- `POST /api/change-password` - Change password (protected)
  ```json
  {
    "newPassword": "new-secure-password"
  }
  ```

### Admin (Protected)

- `GET /api/admin/deployment/status` - Get deployment script status
- `POST /api/admin/deployment/deploy` - Trigger deployment
  ```json
  {
    "branch": "main",
    "commitHash": "abc123"
  }
  ```

## Security

### Environment Variables

Set `JWT_SECRET` for production:

```bash
export JWT_SECRET="your-strong-secret-key-here"
```

### Token Storage

- Tokens stored in localStorage
- 24-hour expiration
- Automatic logout on expiration

### Password Requirements

- Minimum 8 characters for user-set passwords
- Default admin password: 16 characters, mixed case + symbols

## Frontend Pages

### `/login` - Login Page

- Clean, centered login form
- Error handling
- Loading states

### `/admin` - Admin Dashboard

- Deployment controls
- System information
- Status badges
- Log viewer

### `/` - Main Dashboard

- Now protected (requires auth)
- Added user info
- Admin and Logout buttons

## Deployment

### Automatic Update

```bash
# From admin dashboard, click "Deploy Now"
# OR from command line:
cd D:\FunnyChistosoPanel
.\deploy.ps1
```

### Manual Deployment

```bash
# Backend
cd backend
go mod tidy
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o c2server-linux .
scp c2server-linux azureuser@20.42.15.210:~/c2-panel/c2server-new

# SSH to VM and replace
ssh azureuser@20.42.15.210
killall c2server
cd ~/c2-panel
mv c2server-new c2server
chmod +x c2server
nohup ./c2server > c2server.log 2>&1 &

# Frontend (if needed)
cd ../frontend
npx vercel --prod
```

## Files Changed/Added

### Backend

- ✅ `models/user.go` - User and auth models
- ✅ `middleware/auth.go` - JWT authentication middleware
- ✅ `services/auth_service.go` - User authentication logic
- ✅ `services/deployment_service.go` - Deployment trigger logic
- ✅ `controllers/auth_controller.go` - Auth endpoints
- ✅ `controllers/deployment_controller.go` - Deployment endpoints
- ✅ `routes/auth_routes.go` - Auth route registration
- ✅ `routes/admin_routes.go` - Admin route registration
- ✅ `api/router.go` - Updated to wire new services
- ✅ `go.mod` - Added JWT and bcrypt dependencies

### Frontend

- ✅ `lib/auth.tsx` - Authentication context/provider
- ✅ `app/login/page.tsx` - Login page
- ✅ `app/admin/page.tsx` - Admin dashboard
- ✅ `app/layout.tsx` - Wrapped with AuthProvider
- ✅ `app/page.tsx` - Added auth protection + admin button

### Scripts

- ✅ `deploy.ps1` - Already existed

## Testing Locally

```bash
# Terminal 1: Backend
cd D:\FunnyChistosoPanel\backend
go run .

# Terminal 2: Frontend
cd D:\FunnyChistosoPanel\frontend
npm run dev

# Open browser
http://localhost:3000/login
```

## Troubleshooting

### "Invalid credentials"

- Check the console output when backend first started
- Password is only shown once during initialization
- Delete `data/c2.bolt` to reset and regenerate

### "Deployment failed"

- Deployment must be triggered from Windows machine
- Ensure `deploy.ps1` exists in project root
- Check deployment logs in admin dashboard

### Frontend not connecting

- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Clear localStorage if token is stale

## Production Considerations

1. **Change JWT Secret**: Set `JWT_SECRET` env var
2. **Change Admin Password**: Use `/admin` change password feature
3. **SSL/TLS**: Already handled by Cloudflare Tunnel
4. **CORS**: Already configured for Vercel domain
5. **Token Refresh**: Consider implementing refresh tokens for > 24h sessions

## Next Steps

- [ ] Add user role management (admin vs viewer)
- [ ] Add deployment history/logs database
- [ ] Add GitHub integration for auto-deploy on push
- [ ] Add 2FA for admin accounts
- [ ] Add deployment rollback feature
