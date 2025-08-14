// src/hooks/useRoomWebsocket.js
import { useEffect, useRef, useState, useCallback } from "react";

export default function useRoomWebsocket(roomCode, onMessage) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!roomCode) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    // If API is cross-origin, set host from env
    console.log('prk ptotocal', protocol)
    // const host = process.env.REACT_APP_WS_BASE || window.location.host;
    const host = "localhost:8000";
    // const host = window.location.host;
    const url = `${protocol}://${host}/api/v1/ws/rooms/${roomCode}`;
    console.log('prk, url', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("ws open", url);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        onMessage && onMessage(msg);
      } catch (e) {
        console.warn("ws parse error", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("ws closed, will not auto-reconnect (implement if you want)");
    };

    ws.onerror = (err) => {
      console.error("ws error", err);
    };
  }, [roomCode, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      try { wsRef.current?.close(); } catch {}
    };
  }, [connect]);

  const send = (obj) => {
    try {
      wsRef.current?.send(JSON.stringify(obj));
    } catch (e) {
      console.warn("ws send error", e);
    }
  };

  return { connected, send, ws: wsRef.current };
}
