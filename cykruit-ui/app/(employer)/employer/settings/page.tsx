"use client";

import { useState, useEffect } from "react";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  User, Bell, Lock, Shield, Eye, EyeOff, Check,
  Mail, Smartphone, Info, AlertTriangle, Trash2,
  Building2, ChevronDown, Loader2,
} from "lucide-react";

// ── Styles ────────────────────────────────────────────────────────────────────
const inputCls     = "w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400";
const inputDisabled= "w-full h-10 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-sm cursor-not-allowed select-none";
const selectCls    = "w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";
const labelCls     = "block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5";
const saveBtnCls   = "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer";

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${on ? "bg-blue-600" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
    </button>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (pw.length >= 12)          s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak",        color: "bg-red-400"     };
  if (s <= 2) return { score: s, label: "Fair",        color: "bg-amber-400"   };
  if (s <= 3) return { score: s, label: "Good",        color: "bg-yellow-400"  };
  if (s === 4) return { score: s, label: "Strong",     color: "bg-emerald-400" };
  return               { score: s, label: "Very Strong",color: "bg-emerald-500" };
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-slate-100 last:border-0">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-0">
      <div className="pr-6">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "account",       label: "Account",       icon: User      },
  { id: "company",       label: "Company",       icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell      },
  { id: "password",      label: "Password",      icon: Lock      },
  { id: "security",      label: "Security",      icon: Shield    },
];

const PLAN_FEATURES = ["25 active job listings", "AI candidate scoring", "3 team seats", "Analytics dashboard", "Priority support"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500–1000", "1000+"];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployerSettingsPage() {
  const { toast }    = useToast();
  const { openModal }= useModal();
  const [tab, setTab]= useState("account");
  const [loading, setLoading] = useState(true);

  // Account
  const [locked, setLocked] = useState({ name: "", email: "" });
  const [phone, setPhone]     = useState("");
  const [timezone, setTimezone] = useState("Pacific Time (PT)");

  const getCsrfToken = () => {
    if (typeof window === "undefined") return "";
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    if (!match) { console.warn("[settings] csrf_token cookie absent — proceeding without it"); return ""; }
    return decodeURIComponent(match[1]);
  };

  // Company basics
  const [companySize, setCompanySize] = useState("51–200");
  const [publicEmail, setPublicEmail] = useState("");

  // Notifications
  const [notifs, setNotifs] = useState({
    newApplication:   true,
    statusChange:     true,
    jobExpiry:        true,
    weeklyReport:     false,
    marketing:        false,
    emailEnabled:     true,
    pushEnabled:      false,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const [meRes, settingsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/settings", { credentials: "include" }),
        ]);
        if (meRes.ok) {
          const me = await meRes.json();
          const u = me?.data ?? me;
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
          setLocked({ name: fullName || u.name || u.fullName || "", email: u.email ?? "" });
        }
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          const d = s?.data ?? s;
          const general = d?.general ?? d;
          const notifs = d?.notifications;
          if (general.phone    !== undefined) setPhone(general.phone);
          if (general.timezone !== undefined) setTimezone(general.timezone);
          if (general.companySize   !== undefined) setCompanySize(general.companySize);
          if (general.publicEmail   !== undefined) setPublicEmail(general.publicEmail);
          if (notifs !== undefined) setNotifs((prev) => ({ ...prev, ...notifs }));
        }
      } catch {
        // silent — fields remain at defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function saveGeneral() {
    try {
      const res = await fetch("/api/settings/general", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ phone, timezone }),
      });
      if (res.ok) {
        toast({ type: "success", message: "Contact details saved" });
      } else {
        const e = await res.json().catch(() => ({}));
        toast({ type: "error", message: e.message || "Failed to save details" });
      }
    } catch {
      toast({ type: "error", message: "Network error" });
    }
  }

  async function saveCompany() {
    try {
      const res = await fetch("/api/settings/general", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ companySize, publicEmail }),
      });
      if (res.ok) {
        toast({ type: "success", message: "Company settings saved" });
      } else {
        const e = await res.json().catch(() => ({}));
        toast({ type: "error", message: e.message || "Failed to save settings" });
      }
    } catch {
      toast({ type: "error", message: "Network error" });
    }
  }

  async function saveNotifs() {
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ notifications: notifs }),
      });
      if (res.ok) {
        toast({ type: "success", message: "Notification preferences saved" });
      } else {
        const e = await res.json().catch(() => ({}));
        toast({ type: "error", message: e.message || "Failed to save preferences" });
      }
    } catch {
      toast({ type: "error", message: "Network error" });
    }
  }

  // Password
  const [pwForm, setPwForm]   = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
  const strength               = passwordStrength(pwForm.newPw);

  function changePassword() {
    if (!pwForm.current)             { toast({ type: "error",   message: "Enter your current password" }); return; }
    if (pwForm.newPw.length < 8)     { toast({ type: "error",   message: "Password too short", description: "Must be at least 8 characters." }); return; }
    if (pwForm.newPw !== pwForm.confirm){ toast({ type: "error", message: "Passwords don't match" }); return; }
    if (strength.score < 2)          { toast({ type: "warning", message: "Password too weak", description: "Please choose a stronger password." }); return; }
    openModal({
      title: "Change password?",
      description: "You will be signed out of all other sessions after changing your password.",
      variant: "info",
      confirmLabel: "Yes, change it",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/auth/change-password", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
            body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
          });
          if (res.ok) {
            setPwForm({ current: "", newPw: "", confirm: "" });
            toast({ type: "success", message: "Password updated", description: "You've been signed out of other sessions." });
          } else {
            const e = await res.json().catch(() => ({}));
            toast({ type: "error", message: e.message || "Failed to change password" });
          }
        } catch {
          toast({ type: "error", message: "Network error" });
        }
      },
    });
  }

  // Security
  const [twoFa, setTwoFa] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  async function deleteAccount() {
    if (!deletePassword) {
      toast({ type: "error", message: "Password required", description: "Please enter your password to confirm." });
      return;
    }
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        toast({ type: "error", message: "Account scheduled for deletion", description: "You will be logged out.", duration: 6000 });
        window.location.href = "/login";
      } else {
        const errResult = await res.json();
        toast({ type: "error", message: errResult.message || "Failed to delete account" });
      }
    } catch (err) {
      toast({ type: "error", message: "Error deleting account" });
    }
  }

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Settings" />
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </main>
      </>
    );
  }

  return (
    <>
      <EmployerTopbar title="Settings" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ── Left tab sidebar ──────────────────────────────────────────── */}
          <div className="w-full md:w-52 md:shrink-0 bg-white rounded-2xl border border-slate-200 p-2 flex flex-row md:flex-col gap-0.5 overflow-x-auto md:sticky md:top-6">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all shrink-0 whitespace-nowrap border cursor-pointer ${
                  tab === id
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tab === id ? "text-blue-600" : "text-slate-400"}`} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Content panel ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">

            {/* ── ACCOUNT ── */}
            {tab === "account" && (
              <div>
                <Section title="Account Information" desc="Your name and email are managed by your account provider.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <div className="relative">
                        <input value={locked.name} disabled className={inputDisabled} />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Managed by your account</p>
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <div className="relative">
                        <input value={locked.email} disabled className={inputDisabled} />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Managed by your account</p>
                    </div>
                  </div>
                </Section>

                <Section title="Contact Details" desc="Contact info for internal use and candidate communication.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Timezone</label>
                      <div className="relative">
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectCls}>
                          {["Pacific Time (PT)", "Mountain Time (MT)", "Central Time (CT)", "Eastern Time (ET)", "UTC", "IST (India)"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <button onClick={saveGeneral} className={saveBtnCls}>
                    <Check className="w-3.5 h-3.5" /> Save Details
                  </button>
                </Section>

                <Section title="Plan & Billing" desc="Your current subscription plan and billing details.">
                  <div className="flex items-start justify-between p-4 rounded-xl border border-violet-200 bg-violet-50/50 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">Growth Plan</p>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border text-violet-700 bg-violet-100 border-violet-200">Active</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">$149/mo · Renews 2026-07-23</p>
                      <ul className="space-y-1">
                        {PLAN_FEATURES.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
                            <Check className="w-3 h-3 text-green-500 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <a href="/employer/subscription" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shrink-0">
                      Manage →
                    </a>
                  </div>
                  <a href="/employer/subscription?tab=history" className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    View billing history & invoices →
                  </a>
                </Section>

                <Section title="Danger Zone" desc="Permanent actions that cannot be undone.">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                      <div>
                        <p className="text-sm font-semibold text-red-700">Delete Account</p>
                        <p className="text-xs text-red-400 mt-0.5">Permanently delete your employer account and all associated data.</p>
                      </div>
                      {!showDeleteConfirm && (
                        <button onClick={() => setShowDeleteConfirm(true)}
                          className="mt-3 sm:mt-0 flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                    {showDeleteConfirm && (
                      <div className="p-4 rounded-xl border border-red-200 bg-white">
                         <p className="text-sm font-semibold text-slate-800 mb-2">Confirm Account Deletion</p>
                         <p className="text-xs text-slate-500 mb-4">This action cannot be undone. Please enter your password to confirm.</p>
                         <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Your password" className={inputCls + " mb-4"} />
                         <div className="flex gap-2">
                           <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                           <button onClick={deleteAccount} className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer">Confirm Delete</button>
                         </div>
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            )}

            {/* ── COMPANY ── */}
            {tab === "company" && (
              <div>
                <Section title="Company Display Settings" desc="Quick settings for how your company appears on the platform.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>Company Size</label>
                      <div className="relative">
                        <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={selectCls}>
                          {SIZES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Public Contact Email</label>
                      <input value={publicEmail} onChange={(e) => setPublicEmail(e.target.value)} placeholder="hiring@company.com" className={inputCls} />
                      <p className="text-[10px] text-slate-400 mt-1">Shown to candidates on your job listings</p>
                    </div>
                  </div>
                  <button onClick={saveCompany} className={saveBtnCls}>
                    <Check className="w-3.5 h-3.5" /> Save Settings
                  </button>
                </Section>

                <Section title="Company Profile" desc="Manage your full company profile, logo, bio, and perks.">
                  <a href="/employer/company"
                    className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">Edit Company Profile</p>
                      <p className="text-xs text-slate-400">Logo, bio, culture, perks, social links</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">Open →</span>
                  </a>
                </Section>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === "notifications" && (
              <div>
                <Section title="Email Alerts" desc="Choose what events trigger an email notification.">
                  <div className="space-y-0 -mx-6 -mt-4">
                    {([
                      { key: "newApplication", label: "New application received",   desc: "Someone applies to one of your open roles" },
                      { key: "statusChange",   label: "Applicant stage changes",    desc: "When you or a teammate moves an applicant" },
                      { key: "jobExpiry",      label: "Job listing expiry alerts",  desc: "3 days before a listing expires"           },
                      { key: "weeklyReport",   label: "Weekly hiring report",       desc: "Summary of applicants, views, and activity" },
                      { key: "marketing",      label: "Marketing & product updates",desc: "News, feature releases, and tips from Cykruit" },
                    ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <ToggleRow key={key} label={label} desc={desc}
                        on={notifs[key] as boolean}
                        onChange={(v) => setNotifs({ ...notifs, [key]: v })} />
                    ))}
                  </div>
                </Section>

                <Section title="Delivery Channels" desc="How you receive notifications.">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Email</p>
                          <p className="text-xs text-slate-400">{locked.email}</p>
                        </div>
                      </div>
                      <Toggle on={notifs.emailEnabled} onChange={(v) => setNotifs({ ...notifs, emailEnabled: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Push notifications</p>
                          <p className="text-xs text-slate-400">Browser & mobile alerts</p>
                        </div>
                      </div>
                      <Toggle on={notifs.pushEnabled} onChange={(v) => setNotifs({ ...notifs, pushEnabled: v })} />
                    </div>
                  </div>
                </Section>

                <div className="px-6 py-5">
                  <button onClick={saveNotifs} className={saveBtnCls}>
                    <Check className="w-3.5 h-3.5" /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* ── PASSWORD ── */}
            {tab === "password" && (
              <div>
                <Section title="Change Password" desc="Use a strong, unique password you don't use elsewhere.">
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className={labelCls}>Current Password</label>
                      <div className="relative">
                        <input type={showPw.current ? "text" : "password"} value={pwForm.current}
                          onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                          placeholder="••••••••••" className={`${inputCls} pr-10 font-mono`} />
                        <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>New Password</label>
                      <div className="relative">
                        <input type={showPw.newPw ? "text" : "password"} value={pwForm.newPw}
                          onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                          placeholder="••••••••••" className={`${inputCls} pr-10 font-mono`} />
                        <button type="button" onClick={() => setShowPw({ ...showPw, newPw: !showPw.newPw })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showPw.newPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwForm.newPw && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                            ))}
                          </div>
                          <p className={`text-[10px] font-semibold ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-amber-500" : "text-emerald-600"}`}>
                            {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Confirm New Password</label>
                      <div className="relative">
                        <input type={showPw.confirm ? "text" : "password"} value={pwForm.confirm}
                          onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                          placeholder="••••••••••"
                          className={`${inputCls} pr-10 font-mono ${pwForm.confirm && pwForm.newPw !== pwForm.confirm ? "border-red-300 focus:border-red-400" : ""}`} />
                        <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Passwords don&apos;t match
                        </p>
                      )}
                    </div>

                    <button onClick={changePassword} className={saveBtnCls}>
                      <Check className="w-3.5 h-3.5" /> Update Password
                    </button>
                  </div>
                </Section>
              </div>
            )}

            {/* ── SECURITY ── */}
            {tab === "security" && (
              <div>
                <Section title="Two-Factor Authentication" desc="Add an extra layer of security to your account.">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mb-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Enable 2FA</p>
                      <p className="text-xs text-slate-400 mt-0.5">Require a verification code in addition to your password</p>
                    </div>
                    <Toggle on={twoFa} onChange={setTwoFa} />
                  </div>
                  {twoFa && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-green-200 bg-green-50 max-w-md">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-green-700">2FA is enabled. You'll be asked for a verification code on each new login.</p>
                    </div>
                  )}
                </Section>

                <Section title="Connected Accounts" desc="Services linked to your Cykruit account for sign-in.">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Google</p>
                        <p className="text-xs text-slate-400">{locked.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                  </div>
                </Section>

                <Section title="Active Sessions" desc="Devices currently signed into your account.">
                  <div className="space-y-2.5 max-w-md">
                    {[
                      { device: "Chrome on Windows",  location: "San Francisco, CA", time: "Now (current)", current: true  },
                      { device: "Safari on iPhone 14", location: "San Francisco, CA", time: "3 hours ago",   current: false },
                    ].map((s) => (
                      <div key={s.device} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.device}</p>
                          <p className="text-xs text-slate-400">{s.location} · {s.time}</p>
                        </div>
                        {s.current
                          ? <span className="text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">Current</span>
                          : <button
                              onClick={() => openModal({ variant: "danger", title: "Sign out this session?", description: `${s.device} · ${s.location}`, confirmLabel: "Sign out", onConfirm: () => toast({ type: "success", message: "Session signed out" }) })}
                              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            >
                              Sign out
                            </button>
                        }
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
