"use client";

const CHANNEL = "cykruit_auth";

type AuthEvent = { type: "logout" } | { type: "login"; role: "EMPLOYER" | "SEEKER" };

export function broadcastLogout() {
  try {
    new BroadcastChannel(CHANNEL).postMessage({ type: "logout" } satisfies AuthEvent);
  } catch {}
}

export function broadcastLogin(role: "EMPLOYER" | "SEEKER") {
  try {
    new BroadcastChannel(CHANNEL).postMessage({ type: "login", role } satisfies AuthEvent);
  } catch {}
}

export function subscribeAuthSync(onLogout: () => void, onLogin: (role: "EMPLOYER" | "SEEKER") => void): () => void {
  let ch: BroadcastChannel;
  try {
    ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e: MessageEvent<AuthEvent>) => {
      if (e.data.type === "logout") onLogout();
      else if (e.data.type === "login") onLogin(e.data.role);
    };
  } catch {
    return () => {};
  }
  return () => ch.close();
}
