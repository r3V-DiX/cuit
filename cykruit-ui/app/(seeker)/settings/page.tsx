"use client";

import { useState, useEffect } from "react";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  User, Bell, Lock, Shield, Trash2, Eye, EyeOff,
  Check, Mail, MapPin, Briefcase, Globe, Info,
  AlertTriangle, Smartphone, ChevronDown as ChevronDownIcon,
} from "lucide-react";

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls = "w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all";
const inputDisabled = "w-full h-10 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-sm cursor-not-allowed select-none";
const selectCls = "w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";
const labelCls = "block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5";
const saveBtnCls = "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
    </button>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-400" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Strong", color: "bg-emerald-400" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

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

// ─── Toggle row ───────────────────────────────────────────────────────────────

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

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "password", label: "Password", icon: Lock },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: Eye },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { toast } = useToast();
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState("account");

  // ── Auth method ──
  const [googleAuth, setGoogleAuth] = useState(false);

  // ── Account / preferences ─────────────────────────────────────────────────
  const [lockedUser, setLockedUser] = useState({ name: "User", email: "user@email.com" });

  const [prefs, setPrefs] = useState({
    location: "Mumbai, India",
    phone: "+91 98765 43210",
    desiredRole: "Penetration Tester",
    workMode: "Remote",
    noticePeriod: "Immediate",
    openToWork: true,
  });
  const [prefsBuffer, setPrefsBuffer] = useState(prefs);

  const getCsrfToken = () => {
    if (typeof window === "undefined") return "";
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

  // ── Notification preferences ──────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    jobMatches: true,
    appUpdates: true,
    profileViews: false,
    weeklyDigest: true,
    announcements: false,
    emailNotifs: true,
    pushNotifs: false,
  });

  // ── Privacy & Danger Zone ──────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showOpenToWork: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    async function loadAllSettings() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const userResult = await meRes.json();
          if (userResult.data) {
            const user = userResult.data;
            setLockedUser({
              name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
              email: user.email || "",
            });
            setGoogleAuth(user.provider === "GOOGLE" || user.provider === "GITHUB" || !user.hasPassword);
          }
        }

        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsResult = await settingsRes.json();
          if (settingsResult.data) {
            const data = settingsResult.data;
            const gen = data.general || {};
            const notif = data.notifications || {};
            
            const newPrefs = {
              location: "",
              phone: "",
              desiredRole: gen.desiredRole || "Penetration Tester",
              workMode: gen.preferredWorkModes?.[0] ? (gen.preferredWorkModes[0] === "ONSITE" ? "On-site" : gen.preferredWorkModes[0][0] + gen.preferredWorkModes[0].slice(1).toLowerCase()) : "Remote",
              noticePeriod: gen.availableFrom ? "2 weeks" : "Immediate",
              openToWork: gen.jobSearchStatus === "ACTIVELY_LOOKING",
            };
            setPrefs(newPrefs);
            setPrefsBuffer(newPrefs);

            setNotifPrefs({
              jobMatches: !!notif.jobAlerts?.jobAlert?.email,
              appUpdates: !!notif.applications?.applicationStatus?.email,
              profileViews: false,
              weeklyDigest: notif.jobAlerts?.jobAlert?.frequency === "WEEKLY",
              announcements: false,
              emailNotifs: !!notif.global?.enableEmail,
              pushNotifs: !!notif.global?.enableInApp,
            });

            setPrivacy({
              profileVisible: gen.profileVisibility === "PUBLIC",
              showOpenToWork: gen.jobSearchStatus === "ACTIVELY_LOOKING",
            });
          }
        }

        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileResult = await profileRes.json();
          if (profileResult.data) {
            const basics = profileResult.data.basicInfo || {};
            const phoneVal = basics.phone || "";
            const locVal = basics.location ? [basics.location.city, basics.location.country].filter(Boolean).join(", ") : "";
            
            setPrefs((prev) => {
              const updated = { ...prev, phone: phoneVal, location: locVal, desiredRole: basics.title || prev.desiredRole };
              setPrefsBuffer(updated);
              return updated;
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllSettings();
  }, []);

  async function savePrefs() {
    try {
      const rawMode = prefsBuffer.workMode;
      const workModeMapped = rawMode === "On-site" ? "ONSITE" : rawMode.toUpperCase();
      const modes = workModeMapped === "ANY" ? ["REMOTE", "HYBRID", "ONSITE"] : [workModeMapped];

      const settingsRes = await fetch("/api/settings/general", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({
          jobSearchStatus: prefsBuffer.openToWork ? "ACTIVELY_LOOKING" : "OPEN",
          preferredWorkModes: modes,
        }),
      });

      let locObj = null;
      if (prefsBuffer.location) {
        const parts = prefsBuffer.location.split(",").map(p => p.trim());
        locObj = {
          city: parts[0] || "",
          country: parts[1] || parts[0] || "",
        };
      }
      
      const profileRes = await fetch("/api/profile/basic-info", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({
          location: locObj,
          title: prefsBuffer.desiredRole,
        }),
      });

      if (settingsRes.ok && profileRes.ok) {
        setPrefs(prefsBuffer);
        toast({ type: "success", message: "Preferences saved", description: "Your job preferences have been updated." });
      } else {
        toast({ type: "error", message: "Failed to save preferences" });
      }
    } catch (err) {
      toast({ type: "error", message: "Error saving preferences" });
    }
  }

  async function saveNotifPrefs() {
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({
          enableEmail: notifPrefs.emailNotifs,
          enableInApp: notifPrefs.pushNotifs,
          jobAlert_email: notifPrefs.jobMatches,
          jobAlert_inApp: notifPrefs.jobMatches,
          applicationStatus_email: notifPrefs.appUpdates,
          applicationStatus_inApp: notifPrefs.appUpdates,
          jobAlert_frequency: notifPrefs.weeklyDigest ? "WEEKLY" : "INSTANT",
        }),
      });
      if (res.ok) {
        toast({ type: "success", message: "Notification preferences saved" });
      } else {
        toast({ type: "error", message: "Failed to save notifications" });
      }
    } catch (err) {
      toast({ type: "error", message: "Error saving notifications" });
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  const strength = passwordStrength(pwForm.newPw);

  async function changePassword() {
    if (!pwForm.current) { toast({ type: "error", message: "Enter your current password" }); return; }
    if (pwForm.newPw.length < 8) { toast({ type: "error", message: "Password too short", description: "Must be at least 8 characters." }); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast({ type: "error", message: "Passwords don't match" }); return; }
    if (strength.score < 2) { toast({ type: "warning", message: "Password too weak", description: "Please choose a stronger password." }); return; }
    openModal({
      title: "Change password?",
      description: "You will be signed out of all other sessions after changing your password.",
      variant: "info",
      confirmLabel: "Yes, change it",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/auth/change-password", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": getCsrfToken(),
            },
            body: JSON.stringify({
              currentPassword: pwForm.current,
              newPassword: pwForm.newPw,
            }),
          });
          if (res.ok) {
            setPwForm({ current: "", newPw: "", confirm: "" });
            toast({ type: "success", message: "Password updated", description: "You've been signed out of other sessions." });
          } else {
            const errResult = await res.json();
            toast({ type: "error", message: errResult.message || "Failed to update password" });
          }
        } catch (err) {
          toast({ type: "error", message: "Error updating password" });
        }
      },
    });
  }

  async function savePrivacy() {
    try {
      const res = await fetch("/api/settings/general", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({
          profileVisibility: privacy.profileVisible ? "PUBLIC" : "PRIVATE",
        }),
      });
      if (res.ok) {
        toast({ type: "success", message: "Privacy settings saved" });
      } else {
        toast({ type: "error", message: "Failed to save privacy settings" });
      }
    } catch (err) {
      toast({ type: "error", message: "Error saving privacy settings" });
    }
  }

  async function deleteAccount() {
    if (lockedUser.email && !googleAuth && !deletePassword) {
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

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <SeekerTopbar title="Settings" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col md:flex-row gap-5 items-stretch">

          {/* Sidebar tabs */}
          <div className="w-full md:w-52 md:shrink-0 bg-white rounded-2xl border border-slate-200 p-2 flex flex-row md:flex-col gap-0.5 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all shrink-0 whitespace-nowrap border ${
                  activeTab === id
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? "text-blue-600" : "text-slate-400"}`} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">

            {/* ── ACCOUNT ── */}
            {activeTab === "account" && (
              <div>
                <Section title="Account Information" desc="Your name and email are set by your account and cannot be changed here.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <div className="relative">
                        <input value={lockedUser.name} disabled className={inputDisabled} />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Managed by your account</p>
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <div className="relative">
                        <input value={lockedUser.email} disabled className={inputDisabled} />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Managed by your account</p>
                    </div>
                  </div>
                </Section>

                <Section title="Contact & Location" desc="Used to show relevant local opportunities.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input
                        value={prefsBuffer.phone}
                        onChange={(e) => setPrefsBuffer({ ...prefsBuffer, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Location</label>
                      <input
                        value={prefsBuffer.location}
                        onChange={(e) => setPrefsBuffer({ ...prefsBuffer, location: e.target.value })}
                        placeholder="City, Country"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Job Preferences" desc="We use these to surface the most relevant roles for you.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelCls}>Desired Role</label>
                      <input
                        value={prefsBuffer.desiredRole}
                        onChange={(e) => setPrefsBuffer({ ...prefsBuffer, desiredRole: e.target.value })}
                        placeholder="e.g. Penetration Tester"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Work Mode</label>
                      <div className="relative">
                        <select value={prefsBuffer.workMode} onChange={(e) => setPrefsBuffer({ ...prefsBuffer, workMode: e.target.value })} className={selectCls}>
                          {["Remote", "Hybrid", "On-site", "Any"].map((m) => <option key={m}>{m}</option>)}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Notice Period</label>
                      <div className="relative">
                        <select value={prefsBuffer.noticePeriod} onChange={(e) => setPrefsBuffer({ ...prefsBuffer, noticePeriod: e.target.value })} className={selectCls}>
                          {["Immediate", "2 weeks", "1 month", "2 months", "3 months"].map((n) => <option key={n}>{n}</option>)}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Open to Work</p>
                        <p className="text-xs text-slate-400">Show badge on your profile</p>
                      </div>
                      <Toggle on={prefsBuffer.openToWork} onChange={(v) => setPrefsBuffer({ ...prefsBuffer, openToWork: v })} />
                    </div>
                  </div>
                  <button onClick={savePrefs} className={saveBtnCls}>
                    <Check className="w-3.5 h-3.5" /> Save Preferences
                  </button>
                </Section>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div>
                <Section title="Email Notifications" desc="Choose what you want to be notified about via email.">
                  <div className="space-y-0 -mx-6 -mt-4">
                    {([
                      { key: "jobMatches", label: "New job matches", desc: "When a role matches your profile and preferences" },
                      { key: "appUpdates", label: "Application updates", desc: "Viewed, shortlisted, or rejected status changes" },
                      { key: "profileViews", label: "Profile views", desc: "When a recruiter or employer views your profile" },
                      { key: "weeklyDigest", label: "Weekly job digest", desc: "Summary of top new roles every Monday" },
                      { key: "announcements", label: "Platform announcements", desc: "Product updates and new features" },
                    ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <ToggleRow key={key} label={label} desc={desc} on={notifPrefs[key] as boolean} onChange={(v) => setNotifPrefs({ ...notifPrefs, [key]: v })} />
                    ))}
                  </div>
                </Section>

                <Section title="Delivery Channels" desc="How you want to receive notifications.">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Email</p>
                          <p className="text-xs text-slate-400">{lockedUser.email}</p>
                        </div>
                      </div>
                      <Toggle on={notifPrefs.emailNotifs} onChange={(v) => setNotifPrefs({ ...notifPrefs, emailNotifs: v })} />
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
                      <Toggle on={notifPrefs.pushNotifs} onChange={(v) => setNotifPrefs({ ...notifPrefs, pushNotifs: v })} />
                    </div>
                  </div>
                </Section>

                <div className="px-6 py-5">
                  <button onClick={saveNotifPrefs} className={saveBtnCls}>
                    <Check className="w-3.5 h-3.5" /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* ── PASSWORD & SECURITY ── */}
            {activeTab === "password" && (
              <div>
                {googleAuth ? (
                  /* ── Google auth user: no password exists ── */
                  <Section title="Password" desc="Your account uses Google Sign-In, so there's no password to manage here.">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Signed in with Google</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          You registered using Google OAuth. Password-based login is not available for your account. To change your password, visit your{" "}
                          <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google account settings</a>.
                        </p>
                      </div>
                    </div>
                  </Section>
                ) : (
                  /* ── Password-based user: show change form ── */
                  <Section title="Change Password" desc="Use a strong, unique password you don't use elsewhere.">
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className={labelCls}>Current Password</label>
                        <div className="relative">
                          <input
                            type={showPw.current ? "text" : "password"}
                            value={pwForm.current}
                            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                            placeholder="••••••••••"
                            className={`${inputCls} pr-10 font-mono`}
                          />
                          <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>New Password</label>
                        <div className="relative">
                          <input
                            type={showPw.newPw ? "text" : "password"}
                            value={pwForm.newPw}
                            onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                            placeholder="••••••••••"
                            className={`${inputCls} pr-10 font-mono`}
                          />
                          <button type="button" onClick={() => setShowPw({ ...showPw, newPw: !showPw.newPw })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                          <input
                            type={showPw.confirm ? "text" : "password"}
                            value={pwForm.confirm}
                            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                            placeholder="••••••••••"
                            className={`${inputCls} pr-10 font-mono ${pwForm.confirm && pwForm.newPw !== pwForm.confirm ? "border-red-300 focus:border-red-400" : ""}`}
                          />
                          <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                          <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Passwords don&apos;t match</p>
                        )}
                      </div>

                      <button onClick={changePassword} className={saveBtnCls}>
                        <Check className="w-3.5 h-3.5" /> Update Password
                      </button>
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div>
                <Section title="Connected Accounts" desc="Services linked to your Cykruit account for sign-in.">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
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
                        <p className="text-xs text-slate-400">{googleAuth ? lockedUser.email : "Not connected"}</p>
                      </div>
                    </div>
                    {googleAuth ? (
                      <span className="text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <button className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                </Section>

                <Section title="Active Sessions" desc="Devices currently signed into your account.">
                  <div className="space-y-2.5">
                    {[
                      { device: "Chrome on Windows", location: "Mumbai, IN", time: "Now (current)", current: true },
                      { device: "Safari on iPhone 14", location: "Mumbai, IN", time: "2 hours ago", current: false },
                    ].map((s) => (
                      <div key={s.device} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.device}</p>
                          <p className="text-xs text-slate-400">{s.location} · {s.time}</p>
                        </div>
                        {s.current
                          ? <span className="text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">Current</span>
                          : <button onClick={() => openModal({ variant: "danger", title: "Sign out this session?", description: `${s.device} · ${s.location}`, confirmLabel: "Sign out", onConfirm: () => toast({ type: "success", message: "Session signed out" }) })} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Sign out</button>
                        }
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === "privacy" && (
              <div>
                <Section title="Profile Visibility" desc="Control who can see your profile and how it appears to employers.">
                  <div className="-mx-6 -mt-4 space-y-0">
                    {([
                      { key: "profileVisible", label: "Profile visible to employers", desc: "Employers and recruiters can find and view your profile" },
                      { key: "showOpenToWork", label: "Show 'Open to Work' badge",    desc: "Displays a green badge on your profile" },
                    ] as { key: keyof typeof privacy; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <ToggleRow key={key} label={label} desc={desc} on={privacy[key]} onChange={(v) => setPrivacy({ ...privacy, [key]: v })} />
                    ))}
                  </div>
                </Section>

                <div className="px-6 py-5 border-b border-slate-100">
                  <button onClick={savePrivacy} className={saveBtnCls}>
                    <Check className="w-3.5 h-3.5" /> Save Privacy Settings
                  </button>
                </div>

                <Section title="Danger Zone" desc="Permanent actions that cannot be undone.">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                      <div>
                        <p className="text-sm font-semibold text-red-700">Delete Account</p>
                        <p className="text-xs text-red-400 mt-0.5">Permanently delete your account and all associated data.</p>
                      </div>
                      {!showDeleteConfirm && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="mt-3 sm:mt-0 flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Account
                        </button>
                      )}
                    </div>
                    {showDeleteConfirm && (
                      <div className="p-4 rounded-xl border border-red-200 bg-white">
                         <p className="text-sm font-semibold text-slate-800 mb-2">Confirm Account Deletion</p>
                         <p className="text-xs text-slate-500 mb-4">This action cannot be undone. Please enter your password to confirm.</p>
                         {!googleAuth && (
                           <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Your password" className={inputCls + " mb-4"} />
                         )}
                         <div className="flex gap-2">
                           <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                           <button onClick={deleteAccount} className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Confirm Delete</button>
                         </div>
                      </div>
                    )}
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
