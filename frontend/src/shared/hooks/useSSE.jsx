import {useEffect, useRef} from "react";
import {auth} from "../../config/firebase.js";
import {runtimeConfig} from "../../config/runtimeConfig.js";

const API_BASE_URL = runtimeConfig.apiBaseUrl;
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Hook quản lý SSE connection tới backend.
 * Tự động reconnect với exponential backoff. Khi gặp 401, force refresh token Firebase.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Có kết nối hay không (thường = !!user)
 * @param {Object} options.handlers - Map<eventName, handler(data)>
 */
export default function useSSE({enabled = false, handlers = {}}) {
  const readerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    let disposed = false;

    const cleanupConnection = () => {
      if (!readerRef.current) return;
      try {
        readerRef.current.cancel();
      } catch {
        /* noop */
      }
      readerRef.current = null;
    };

    const cleanupTimer = () => {
      if (!reconnectTimerRef.current) return;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const scheduleReconnect = (connect) => {
      if (disposed || !enabled || reconnectTimerRef.current) return;
      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(RECONNECT_DELAY_MS * Math.pow(2, attempts), MAX_RECONNECT_DELAY_MS);
      reconnectAttemptsRef.current = attempts + 1;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!disposed) void connect();
      }, delay);
    };

    const connect = async () => {
      cleanupConnection();
      if (disposed || !enabled || !auth.currentUser) return;

      try {
        const forceRefresh = reconnectAttemptsRef.current >= 1;
        const token = await auth.currentUser.getIdToken(forceRefresh);
        const response = await fetch(`${API_BASE_URL}/sse/stream`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "text/event-stream",
          },
        });

        if (!response.ok) {
          throw new Error(`SSE connect failed: ${response.status}`);
        }

        reconnectAttemptsRef.current = 0;
        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "message";
        let currentData = "";

        while (!disposed) {
          const {done, value} = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, {stream: true});
          let newlineIdx;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              currentData += line.slice(6);
            } else if (line === "" && currentData) {
              try {
                handlersRef.current[currentEvent]?.(JSON.parse(currentData));
              } catch {
                /* heartbeat comments hoặc dữ liệu không hợp lệ */
              }
              currentEvent = "message";
              currentData = "";
            }
          }
        }
      } catch (err) {
        if (!disposed && err.name !== "AbortError") {
          console.warn("SSE connection error:", err.message);
        }
      } finally {
        readerRef.current = null;
        scheduleReconnect(connect);
      }
    };

    reconnectAttemptsRef.current = 0;
    if (enabled) void connect();

    return () => {
      disposed = true;
      cleanupConnection();
      cleanupTimer();
    };
  }, [enabled]);
}
