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
        socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
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
              } catch {
              }
            }
          }, 30000); // 30 seconds
        };

        socket.onmessage = (e) => {
          const data = e.data;
          // Ignore pong responses
          if (data === "pong" || data === '{"type":"pong"}') {
            return;
          }
          setLastMessage(data);
        };

        socket.onclose = () => {
          setConnected(false);

          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          if (!intentionalCloseRef.current) {
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
            }
            reconnectTimerRef.current = setTimeout(connect, 3000);
          } else {
            // Intentional close
          }
        };

        socket.onerror = () => {
          // Let onclose handle reconnection
        };
      } catch {
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
