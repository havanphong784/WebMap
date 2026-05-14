import {useCallback, useEffect, useRef} from "react";
import {auth} from "../../config/firebase.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
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
  handlersRef.current = handlers;

  // Cleanup helpers tách ra để tránh stale closure
  const cleanupConnection = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {
        /* noop */
      }
      readerRef.current = null;
    }
  }, []);

  const cleanupTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    cleanupConnection();
    if (!enabled || !auth.currentUser) return;

    try {
      // forceRefresh nếu đã reconnect lỗi nhiều lần (token có thể hết hạn).
      const forceRefresh = reconnectAttemptsRef.current >= 1;
      const token = await auth.currentUser.getIdToken(forceRefresh);
      const response = await fetch(`${API_BASE_URL}/sse/stream`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "text/event-stream",
        },
      });

      if (!response.ok) {
        // 401 => sẽ force refresh ở lần kế tiếp
        throw new Error(`SSE connect failed: ${response.status}`);
      }

      // Connect thành công, reset backoff
      reconnectAttemptsRef.current = 0;

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "message";
      let currentData = "";

      try {
        while (true) {
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
              currentData = line.slice(6);
            } else if (line === "" && currentData) {
              try {
                const parsed = JSON.parse(currentData);
                const handler = handlersRef.current[currentEvent];
                if (handler) handler(parsed);
              } catch {
                /* heartbeat comments hoặc dòng không hợp lệ */
              }
              currentEvent = "message";
              currentData = "";
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("SSE stream interrupted:", err.message);
        }
      }
    } catch (err) {
      console.warn("SSE connection error:", err.message);
    } finally {
      readerRef.current = null;
      scheduleReconnect();
    }
  }, [enabled, cleanupConnection]);

  const scheduleReconnect = useCallback(() => {
    if (!enabled || reconnectTimerRef.current) return;
    const attempts = reconnectAttemptsRef.current;
    const delay = Math.min(RECONNECT_DELAY_MS * Math.pow(2, attempts), MAX_RECONNECT_DELAY_MS);
    reconnectAttemptsRef.current = attempts + 1;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (enabled) connect();
    }, delay);
  }, [enabled, connect]);

  useEffect(() => {
    if (enabled) {
      reconnectAttemptsRef.current = 0;
      connect();
    } else {
      cleanupConnection();
      cleanupTimers();
    }

    return () => {
      cleanupConnection();
      cleanupTimers();
    };
  }, [enabled, connect, cleanupConnection, cleanupTimers]);
}
