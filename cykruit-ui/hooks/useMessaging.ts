"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "@/lib/api";

export type WsMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  type: string;
};

type MessageNewPayload = {
  conversationId: string;
  message: WsMessage;
};

type UseMessagingOptions = {
  conversationId: string | null;
  onMessageNew: (payload: MessageNewPayload) => void;
  enabled?: boolean;
};

// Falls back to notification-service's direct dev port, matching proxy.ts's CSP default —
// window.location.origin (the Next.js app itself) can never serve a /messaging socket.io namespace.
const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL || "http://127.0.0.1:4007")
    : "";

async function fetchWsToken(attempt = 0): Promise<string | null> {
  try {
    const { data } = await apiFetch<{ token?: string }>("/api/notifications/ws/token");
    return data?.token ?? null;
  } catch {
    if (attempt >= 3) return null;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return fetchWsToken(attempt + 1);
  }
}

export function useMessaging({
  conversationId,
  onMessageNew,
  enabled = true,
}: UseMessagingOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onMessageNewRef = useRef(onMessageNew);
  onMessageNewRef.current = onMessageNew;

  const joinConversation = useCallback((convId: string) => {
    socketRef.current?.emit("join:conversation", { conversationId: convId });
  }, []);

  const leaveConversation = useCallback((convId: string) => {
    socketRef.current?.emit("leave:conversation", { conversationId: convId });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let socket: Socket;
    let active = true;

    (async () => {
      const token = await fetchWsToken();
      if (!token || !active) return;

      socket = io(`${WS_URL}/messaging`, {
        auth: { token },
        // Gateway only proxies WebSocket traffic under /ws (see apps/gateway/src/main.ts),
        // stripping that prefix before forwarding to notification-service's default
        // /socket.io path — the client must request the same /ws-prefixed path.
        path: "/ws/socket.io",
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on("message:new", (payload: MessageNewPayload) => {
        onMessageNewRef.current(payload);
      });

      socket.on("connect_error", (err) => {
        console.warn("[WS] connect error:", err.message);
      });

      socketRef.current = socket;

      if (conversationId) {
        socket.on("connect", () => {
          socket.emit("join:conversation", { conversationId });
        });
        if (socket.connected) {
          socket.emit("join:conversation", { conversationId });
        }
      }
    })();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!conversationId || !socketRef.current?.connected) return;
    socketRef.current.emit("join:conversation", { conversationId });
    return () => {
      socketRef.current?.emit("leave:conversation", { conversationId });
    };
  }, [conversationId]);

  return { joinConversation, leaveConversation };
}
