"use client";

import { useState } from "react";
import { Shield, Mail, MessageSquare, User, Send, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ type: "error", message: "Full name is required" });
      return;
    }
    if (!email.trim()) {
      toast({ type: "error", message: "Email is required" });
      return;
    }
    if (!message.trim()) {
      toast({ type: "error", message: "Message is required" });
      return;
    }
    if (message.trim().length < 10) {
      toast({ type: "error", message: "Message must be at least 10 characters" });
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/public/contact", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), message: message.trim() }),
      });
      setSubmitted(true);
    } catch (err: any) {
      toast({ type: "error", message: err.message ?? "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-16">
        <div className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-grid-md" />
          <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-600 transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                CONTACT
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
                Get in Touch
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed">
                Have a question, partnership idea, or just want to say hi? We read every message.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left — info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6">How can we help?</h2>
                <div className="space-y-5">
                  {[
                    {
                      icon: Shield,
                      title: "Security Professionals",
                      desc: "Questions about your profile, applications, or how matching works? We're here.",
                      color: "text-blue-600",
                      bg: "bg-blue-50 border-blue-100",
                    },
                    {
                      icon: User,
                      title: "Employers & Hiring Teams",
                      desc: "Want to post jobs, understand our pricing, or book a product demo? Reach out.",
                      color: "text-purple-600",
                      bg: "bg-purple-50 border-purple-100",
                    },
                    {
                      icon: MessageSquare,
                      title: "Partnerships & Press",
                      desc: "Interested in integrations, API access, or a media inquiry? Let us know.",
                      color: "text-cyan-600",
                      bg: "bg-cyan-50 border-cyan-100",
                    },
                    {
                      icon: Mail,
                      title: "General Enquiries",
                      desc: "Anything else — we'll get back to you within one business day.",
                      color: "text-green-600",
                      bg: "bg-green-50 border-green-100",
                    },
                  ].map(({ icon: Icon, title, desc, color, bg }) => (
                    <div key={title} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-0.5">{title}</p>
                        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400 tracking-widest">RESPONSE_TIME</span>
                </div>
                <p className="text-sm font-mono text-green-400">
                  We typically respond within <span className="text-white font-bold">24 hours</span> on business days.
                </p>
              </div>
            </div>

            {/* Right — form */}
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider ml-2">contact.form</span>
                </div>

                {submitted ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="w-7 h-7 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Message sent!</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      We got your message and will reply within one business day.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFullName("");
                        setEmail("");
                        setMessage("");
                      }}
                      className="text-sm font-mono text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-widest">
                        FULL_NAME <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-widest">
                        EMAIL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        maxLength={150}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-widest">
                        MESSAGE <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind..."
                        rows={5}
                        maxLength={2000}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors resize-none"
                      />
                      <p className="text-[11px] font-mono text-slate-300 text-right mt-1">
                        {message.length}/2000
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center font-mono">
                      Rate limited to 3 messages per hour per IP
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
