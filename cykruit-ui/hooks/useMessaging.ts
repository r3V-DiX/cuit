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
  allConversationIds?: string[];
  onMessageNew: (payload: MessageNewPayload) => void;
  enabled?: boolean;
};

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
  allConversationIds,
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

      // Join ALL conversation rooms on connect so messages on any conv are received
      socket.on("connect", () => {
        const ids = allConversationIds ?? (conversationId ? [conversationId] : []);
        ids.forEach((id) => socket.emit("join:conversation", { conversationId: id }));
      });

      if (socket.connected) {
        const ids = allConversationIds ?? (conversationId ? [conversationId] : []);
        ids.forEach((id) => socket.emit("join:conversation", { conversationId: id }));
      }
    })();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // When conversationId changes, join new (already in room if allConversationIds was provided)
  useEffect(() => {
    if (!conversationId || !socketRef.current?.connected) return;
    socketRef.current.emit("join:conversation", { conversationId });
    return () => {
      // Don't leave — we want to keep receiving messages for all convs
    };
  }, [conversationId]);

  return { joinConversation, leaveConversation };
}
