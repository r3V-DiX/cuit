"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { MessageSquare, Send, Search, Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { apiFetch, authHeaders } from "@/lib/api";

type Message = {
  id: string | number;
  from: "seeker" | "employer";
  text: string;
  time: string;
  timeTs: number;
};

type Conversation = {
  id: string;
  candidateName: string;
  candidateInitials: string;
  candidateAccent: string;
  companyName: string;
  companyInitials: string;
  companyAccent: string;
  jobTitle: string;
  jobId: string;
  messages: Message[];
  seekerUnread: number;
  employerUnread: number;
};

const ACCENTS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-amber-500", "bg-cyan-500",
];

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function SeekerMessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const [meResult, convsResult] = await Promise.all([
          apiFetch("/api/auth/me").catch(() => null),
          apiFetch("/api/conversations").catch(() => null),
        ]);

        let userId = "";
        let initials = "Me";
        if (meResult) {
          userId = meResult.data?.id || "";
          const firstName = meResult.data?.firstName || "";
          const lastName = meResult.data?.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          initials = getInitials(fullName) || "Me";
          setCurrentUserId(userId);
        }

        if (convsResult) {
          const items: any[] = convsResult.data?.items || [];
          const mapped: Conversation[] = items.map((conv: any, idx: number) => {
            const employer = conv.participants?.find((p: any) => p.role === "EMPLOYER");
            const companyName = employer
              ? `${employer.user?.firstName || ""} ${employer.user?.lastName || ""}`.trim() || "Employer"
              : "Employer";
            const lastMsg = conv.lastMessage;
            const messages: Message[] = lastMsg
              ? [{
                  id: lastMsg.id,
                  from: lastMsg.senderId === userId ? "seeker" : "employer",
                  text: lastMsg.content,
                  time: formatTime(lastMsg.createdAt),
                  timeTs: new Date(lastMsg.createdAt).getTime(),
                }]
              : [];
            return {
              id: conv.id,
              candidateName: "",
              candidateInitials: initials,
              candidateAccent: "bg-blue-600",
              companyName,
              companyInitials: getInitials(companyName),
              companyAccent: ACCENTS[idx % ACCENTS.length],
              jobTitle: conv.jobId ? `Job #${conv.jobId}` : "Position",
              jobId: conv.jobId || "",
              messages,
              seekerUnread: conv.myUnread || 0,
              employerUnread: 0,
            };
          });
          setConvs(mapped);
          if (mapped.length > 0) {
            const firstId = mapped[0].id;
            setActiveId(firstId);
            try {
              const fullResult = await apiFetch(`/api/conversations/${firstId}`);
              const fullMessages: Message[] = (fullResult.data?.messages || []).map((msg: any) => ({
                id: msg.id,
                from: msg.senderId === userId ? "seeker" : "employer",
                text: msg.content,
                time: formatTime(msg.createdAt),
                timeTs: new Date(msg.createdAt).getTime(),
              }));
              setConvs((prev) =>
                prev.map((c) => c.id === firstId ? { ...c, messages: fullMessages } : c)
              );
            } catch {}
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const active = convs.find((c) => c.id === activeId);

  const filtered = convs.filter(
    (c) =>
      search === "" ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  async function selectConv(id: string) {
    setActiveId(id);
    setConvs((prev) => prev.map((c) => c.id === id ? { ...c, seekerUnread: 0 } : c));
    try {
      const convResult = await apiFetch(`/api/conversations/${id}`);
      apiFetch(`/api/conversations/${id}/read`, { method: "PATCH", headers: authHeaders() }).catch(() => {});
      const messages: Message[] = (convResult.data?.messages || []).map((msg: any) => ({
        id: msg.id,
        from: msg.senderId === currentUserId ? "seeker" : "employer",
        text: msg.content,
        time: formatTime(msg.createdAt),
        timeTs: new Date(msg.createdAt).getTime(),
      }));
      setConvs((prev) =>
        prev.map((c) => c.id === id ? { ...c, messages, seekerUnread: 0 } : c)
      );
    } catch {}
  }

  async function sendMessage() {
    if (!input.trim() || !active) return;
    const content = input.trim();
    setInput("");
    try {
      const result = await apiFetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content }),
      });
      const returned = result.data;
      const newMsg: Message = {
        id: returned.id,
        from: "seeker",
        text: returned.content,
        time: formatTime(returned.createdAt),
        timeTs: new Date(returned.createdAt).getTime(),
      };
      setConvs((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages: [...c.messages, newMsg] } : c
        )
      );
    } catch {}
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  const totalUnread = convs.reduce((s, c) => s + c.seekerUnread, 0);

  const [showList, setShowList] = useState(true);

  const handleMessageNew = useCallback(({ conversationId, message }: { conversationId: string; message: any }) => {
    setConvs((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const newMsg: Message = {
          id: message.id,
          from: message.senderId === currentUserId ? "seeker" : "employer",
          text: message.content,
          time: formatTime(message.createdAt),
          timeTs: new Date(message.createdAt).getTime(),
        };
        const alreadyExists = c.messages.some((m) => m.id === newMsg.id);
        if (alreadyExists) return c;
        return {
          ...c,
          messages: [...c.messages, newMsg],
          seekerUnread: c.id === activeId ? 0 : c.seekerUnread + (newMsg.from === "employer" ? 1 : 0),
        };
      })
    );
  }, [currentUserId, activeId]);

  useMessaging({
    conversationId: activeId || null,
    onMessageNew: handleMessageNew,
    enabled: !loading,
  });

  function openConv(id: string) {
    selectConv(id);
    setShowList(false);
  }

  if (loading) {
    return (
      <>
        <SeekerTopbar title="Messages" />
        <main className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <SeekerTopbar title="Messages" />
      <main className="flex-1 overflow-hidden flex">

        {/* ── Left panel: conversation list ── */}
        <div className={`${showList ? "flex" : "hidden"} md:flex w-full md:w-80 shrink-0 border-r border-slate-200 bg-white flex-col`}>

          {/* Header */}
          <div className="px-4 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Inbox</h2>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">
                  {totalUnread} new
                </span>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No conversations found</div>
            ) : filtered.map((conv) => {
              const last = conv.messages[conv.messages.length - 1];
              const isActive = conv.id === activeId;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConv(conv.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Company avatar */}
                    <div className={`w-10 h-10 rounded-xl ${conv.companyAccent} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {conv.companyInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          {conv.companyName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{last?.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.jobTitle}</p>
                      <p className={`text-[11px] truncate mt-1 ${conv.seekerUnread > 0 ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                        {last?.from === "seeker" ? "You: " : ""}{last?.text}
                      </p>
                    </div>
                    {conv.seekerUnread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-1">
                        {conv.seekerUnread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: chat window ── */}
        {active ? (
          <div className={`${showList ? "hidden" : "flex"} md:flex flex-1 flex-col bg-slate-50 min-w-0`}>

            {/* Chat header */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4">
              <button onClick={() => setShowList(true)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div className={`w-11 h-11 rounded-xl ${active.companyAccent} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {active.companyInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{active.companyName}</h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Briefcase className="w-3 h-3" /> {active.jobTitle}
                  </span>
                </div>
              </div>
              <a
                href={`/jobs/${active.jobId}`}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors shrink-0"
              >
                View Job <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-5 space-y-4">
              {active.messages.map((msg) => {
                const isMe = msg.from === "seeker";
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-xl ${active.companyAccent} flex items-center justify-center text-white text-[10px] font-bold shrink-0 self-end`}>
                        {active.companyInitials}
                      </div>
                    )}
                    {isMe && (
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 self-end">
                        {active.candidateInitials}
                      </div>
                    )}
                    {/* Bubble */}
                    <div className={`max-w-[85%] md:max-w-[68%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 px-3 md:px-6 py-4">
              <div className="flex items-center gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Press Enter to send</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 text-center">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
          </div>
        )}

      </main>
    </>
  );
}
