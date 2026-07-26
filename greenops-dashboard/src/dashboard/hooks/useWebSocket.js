import { useEffect, useState, useRef } from "react";

const WS_URL = "ws://localhost:8000/ws/live";

export function useLiveStream() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 WS connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "live_update") {
            setData(msg);
          } else if (msg.type === "alert" || msg.type === "scaling_event") {
            setAlerts((a) => [
              { id: Date.now(), ...msg },
              ...a.slice(0, 4),
            ]);
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("🔴 WS disconnected, retry in 3s...");
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { data, connected, alerts };
}
