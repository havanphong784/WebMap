import {useCallback, useEffect, useRef} from "react";
import {auth} from "../../config/firebase.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Hook quản lý SSE connection tới backend.
 * Tự động reconnect khi mất kết nối.
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Có kết nối hay không (thường = !!user)
 * @param {Object} options.handlers - Map<eventName, handler(data)>
 */
export default function useSSE({enabled = false, handlers = {}}) {
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(async () => {
    // Cleanup existing
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (!enabled || !auth.currentUser) return;

    try {
      const token = await auth.currentUser.getIdToken();
      const url = `${API_BASE_URL}/sse/stream`;

      // EventSource không hỗ trợ custom headers, dùng fetch + ReadableStream
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "text/event-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`SSE connect failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processStream = async () => {
        try {
          while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let currentEvent = "message";
            let currentData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                currentData = line.slice(6);
              } else if (line === "" && currentData) {
                // End of event
                try {
                  const parsed = JSON.parse(currentData);
                  const handler = handlersRef.current[currentEvent];
                  if (handler) handler(parsed);
                } catch {
                  // Ignore parse errors (heartbeat comments etc)
                }
                currentEvent = "message";
                currentData = "";
              }
            }
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            console.warn("SSE stream ended:", err.message);
          }
        }

        // Stream ended — schedule reconnect
        scheduleReconnect();
      };

      // Store reader for cleanup
      eventSourceRef.current = {close: () => reader.cancel()};
      processStream();
    } catch (err) {
      console.warn("SSE connection error:", err.message);
      scheduleReconnect();
    }
  }, [enabled]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (enabled) connect();
    }, 5000); // Reconnect sau 5s
  }, [enabled, connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [enabled, connect]);
}
