"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onmessage = (e) => setLastMessage(e.data);
      socket.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [url]);

  return { lastMessage, connected };
}
