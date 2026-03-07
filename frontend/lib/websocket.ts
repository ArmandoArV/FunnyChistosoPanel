"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentionalCloseRef = useRef(false);

  useEffect(() => {
    let socket: WebSocket;

    function connect() {
      try {
        console.log("[WS] Connecting to", url);
        socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log("[WS] Connected");
          setConnected(true);
          intentionalCloseRef.current = false;

          // Start keepalive ping every 30 seconds
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }
          pingIntervalRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(JSON.stringify({ type: "ping" }));
                console.log("[WS] Sent ping");
              } catch (err) {
                console.error("[WS] Failed to send ping:", err);
              }
            }
          }, 30000); // 30 seconds
        };

        socket.onmessage = (e) => {
          const data = e.data;
          // Ignore pong responses
          if (data === "pong" || data === '{"type":"pong"}') {
            console.log("[WS] Received pong");
            return;
          }
          setLastMessage(data);
        };

        socket.onclose = (event) => {
          console.log("[WS] Disconnected", event.code, event.reason);
          setConnected(false);
          
          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          // Only reconnect if not intentionally closed
          if (!intentionalCloseRef.current) {
            console.log("[WS] Reconnecting in 3 seconds...");
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
            }
            reconnectTimerRef.current = setTimeout(connect, 3000);
          } else {
            console.log("[WS] Intentional close, not reconnecting");
          }
        };

        socket.onerror = (error) => {
          console.error("[WS] Error:", error);
          // Let onclose handle reconnection
        };
      } catch (err) {
        console.error("[WS] Connection failed:", err);
        setConnected(false);
        if (!intentionalCloseRef.current) {
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      console.log("[WS] Cleanup: closing connection");
      intentionalCloseRef.current = true;
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    };
  }, [url]);

  return { lastMessage, connected };
}
