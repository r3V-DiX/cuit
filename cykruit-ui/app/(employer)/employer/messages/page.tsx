"use client";

import { useState, useRef, useEffect } from "react";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { Send, Search, Briefcase, ChevronRight } from "lucide-react";
import { CONVERSATIONS, type Conversation, type Message } from "@/lib/messages-data";

// Employer sees ALL conversations across all candidates
export default function EmployerMessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const local = localStorage.getItem("cykruit_messages");
    if (local) {
      const parsed = JSON.parse(local);
      setConvs(parsed);
      if (parsed.length > 0) setActiveId(parsed[0].id);
    } else {
      localStorage.setItem("cykruit_messages", JSON.stringify(CONVERSATIONS));
      setConvs(CONVERSATIONS);
      if (CONVERSATIONS.length > 0) setActiveId(CONVERSATIONS[0].id);
    }
  }, []);

  const active = convs.find((c) => c.id === activeId);

  const filtered = convs.filter((c) =>
    search === "" ||
    c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
    c.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  function selectConv(id: string) {
    setActiveId(id);
    setConvs((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, employerUnread: 0 } : c);
      localStorage.setItem("cykruit_messages", JSON.stringify(next));
      return next;
    });
  }

  function sendMessage() {
    if (!input.trim() || !active) return;
    const newMsg: Message = {
      id: active.messages.length + 1,
      from: "employer",
      text: input.trim(),
      time: "Just now",
      timeTs: Date.now(),
    };
    setConvs((prev) => {
      const next = prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], employerUnread: 0 }
          : c
      );
      localStorage.setItem("cykruit_messages", JSON.stringify(next));
      return next;
    });
    setInput("");
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

  const totalUnread = convs.reduce((s, c) => s + c.employerUnread, 0);

  const [showList, setShowList] = useState(true);

  function openConv(id: string) {
    selectConv(id);
    setShowList(false);
  }

  return (
    <>
      <EmployerTopbar title="Messages" />
      <main className="flex-1 overflow-hidden flex">

        {/* ── Left panel: conversation list ── */}
        <div className={`${showList ? "flex" : "hidden"} md:flex w-full md:w-80 shrink-0 border-r border-slate-200 bg-white flex-col`}>

          {/* Header */}
          <div className="px-4 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Conversations</h2>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">
                  {totalUnread} new
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate or role..."
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
                    {/* Candidate avatar */}
                    <div className={`w-10 h-10 rounded-xl ${conv.candidateAccent} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {conv.candidateInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          {conv.candidateName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{last.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.jobTitle}</p>
                      <p className={`text-[11px] truncate mt-1 ${conv.employerUnread > 0 ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                        {last.from === "employer" ? "You: " : `${conv.candidateName.split(" ")[0]}: `}{last.text}
                      </p>
                    </div>
                    {conv.employerUnread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-1">
                        {conv.employerUnread}
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
              <div className={`w-11 h-11 rounded-xl ${active.candidateAccent} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {active.candidateInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{active.candidateName}</h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Briefcase className="w-3 h-3" /> {active.jobTitle}
                  </span>
                </div>
              </div>
              <a
                href={`/employer/jobs/${active.jobId}`}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors shrink-0"
              >
                View Job <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-5 space-y-4">
              {active.messages.map((msg) => {
                const isMe = msg.from === "employer";
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-xl ${active.candidateAccent} flex items-center justify-center text-white text-[10px] font-bold shrink-0 self-end`}>
                        {active.candidateInitials}
                      </div>
                    )}
                    {isMe && (
                      <div className={`w-8 h-8 rounded-xl ${active.companyAccent} flex items-center justify-center text-white text-[10px] font-bold shrink-0 self-end`}>
                        {active.companyInitials}
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
                  placeholder={`Message ${active.candidateName.split(" ")[0]}...`}
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
            <svg className="w-8 h-8 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
          </div>
        )}

      </main>
    </>
  );
}
