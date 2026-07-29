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

// WS routes through the same origin via nginx /ws/ → localhost:4007.
// Never use NEXT_PUBLIC_WS_URL — it bakes the API domain at build time and breaks this.
const WS_URL = typeof window !== "undefined" ? window.location.origin : "";

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

  // Keep a live ref so the connect handler always reads current IDs,
  // not a stale closure captured at effect-run time.
  const allConversationIdsRef = useRef<string[]>(allConversationIds ?? []);
  allConversationIdsRef.current = allConversationIds ?? [];
  const conversationIdRef = useRef<string | null>(conversationId);
  conversationIdRef.current = conversationId;

  // Track which room IDs have been joined so we don't double-emit
  const joinedIdsRef = useRef<Set<string>>(new Set());

  const joinConversation = useCallback((convId: string) => {
    socketRef.current?.emit("join:conversation", { conversationId: convId });
  }, []);

  const leaveConversation = useCallback((convId: string) => {
    socketRef.current?.emit("leave:conversation", { conversationId: convId });
  }, []);

  // Connect socket once when enabled
  useEffect(() => {
    if (!enabled) return;

    let socket: Socket;
    let active = true;

    const joinAll = () => {
      const ids = allConversationIdsRef.current.length
        ? allConversationIdsRef.current
        : conversationIdRef.current
        ? [conversationIdRef.current]
        : [];
      ids.forEach((id) => {
        if (!joinedIdsRef.current.has(id)) {
          socket.emit("join:conversation", { conversationId: id });
          joinedIdsRef.current.add(id);
        }
      });
    };

    (async () => {
      const token = await fetchWsToken();
      if (!token || !active) return;

      socket = io(`${WS_URL}/messaging`, {
        auth: { token },
        path: "/ws/socket.io",
        transports: ["polling", "websocket"],
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

      // On (re)connect: re-join all rooms using the ref (always current, never stale)
      socket.on("connect", () => {
        joinedIdsRef.current.clear();
        joinAll();
      });

      if (socket.connected) {
        joinAll();
      }
    })();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      joinedIdsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // When conversationId changes, join that room
  useEffect(() => {
    if (!conversationId || !socketRef.current?.connected) return;
    if (!joinedIdsRef.current.has(conversationId)) {
      socketRef.current.emit("join:conversation", { conversationId });
      joinedIdsRef.current.add(conversationId);
    }
  }, [conversationId]);

  // When allConversationIds grows (convs load after socket connects), join new rooms
  useEffect(() => {
    if (!allConversationIds?.length || !socketRef.current?.connected) return;
    allConversationIds.forEach((id) => {
      if (!joinedIdsRef.current.has(id)) {
        socketRef.current!.emit("join:conversation", { conversationId: id });
        joinedIdsRef.current.add(id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allConversationIds]);

  return { joinConversation, leaveConversation };
}
