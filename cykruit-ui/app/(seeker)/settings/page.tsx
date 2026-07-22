"use client";

import { useState, useEffect } from "react";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";
import {
  User, Bell, Shield, Trash2, Eye,
  Check, Mail, MapPin, Briefcase, Globe, Info, Lock,
  AlertTriangle, Smartphone, ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { SessionsPanel } from "@/components/settings/SessionsPanel";
import { useSessionGuard } from "@/lib/use-session-guard";
import { LocationSelect, LocationValue } from "@/components/ui/LocationSelect";

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
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: Eye },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  useSessionGuard();

  // ── Auth method ──
  const [googleAuth, setGoogleAuth] = useState(false);

  // ── Account / preferences ─────────────────────────────────────────────────
  const [lockedUser, setLockedUser] = useState({ name: "User", email: "user@email.com" });

  const [prefs, setPrefs] = useState<{
    location: LocationValue;
    phone: string;
    desiredRole: string;
    workMode: string;
    noticePeriod: string;
    openToWork: boolean;
  }>({
    location: { city: "", state: "", country: "" },
    phone: "",
    desiredRole: "Security Engineer",
    workMode: "Remote",
    noticePeriod: "Immediate",
    openToWork: true,
  });
  const [prefsBuffer, setPrefsBuffer] = useState(prefs);

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

  useEffect(() => {
    async function loadAllSettings() {
      try {
        const userResult = await apiFetch<{ firstName?: string; lastName?: string; email?: string; provider?: string }>("/api/auth/me");
        if (userResult.data) {
          const user = userResult.data;
          setLockedUser({
            name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
            email: user.email || "",
          });
          setGoogleAuth(user.provider === "GOOGLE" || user.provider === "GITHUB");
        }

        const settingsResult = await apiFetch<{ general?: Record<string, any>; notifications?: Record<string, any> }>("/api/settings");
        if (settingsResult.data) {
          const data = settingsResult.data;
          const gen = data.general || {};
          const notif = data.notifications || {};

          const newPrefs = {
            location: { city: "", state: "", country: "" },
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

        const profileResult = await apiFetch<{ basicInfo?: { phone?: string; location?: { city?: string; state?: string; country?: string }; title?: string } }>("/api/profile");
        if (profileResult.data) {
          const basics = profileResult.data.basicInfo || {};
          const phoneVal = basics.phone || "";
          const locVal: LocationValue = basics.location
            ? { city: basics.location.city || "", state: basics.location.state || "", country: basics.location.country || "" }
            : { city: "", state: "", country: "" };

          setPrefs((prev) => {
            const updated = { ...prev, phone: phoneVal, location: locVal, desiredRole: basics.title || prev.desiredRole };
            setPrefsBuffer(updated);
            return updated;
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error(err);
      }
    }
    loadAllSettings();
  }, []);

  async function savePrefs() {
    try {
      const rawMode = prefsBuffer.workMode;
      const workModeMapped = rawMode === "On-site" ? "ONSITE" : rawMode.toUpperCase();
      const modes = workModeMapped === "ANY" ? ["REMOTE", "HYBRID", "ONSITE"] : [workModeMapped];

      await apiFetch("/api/settings/general", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          jobSearchStatus: prefsBuffer.openToWork ? "ACTIVELY_LOOKING" : "OPEN",
          preferredWorkModes: modes,
        }),
      });

      let locObj: LocationValue | null = null;
      if (prefsBuffer.location && prefsBuffer.location.city && prefsBuffer.location.country) {
        locObj = prefsBuffer.location;
      }

      await apiFetch("/api/profile/basic-info", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          location: locObj,
          title: prefsBuffer.desiredRole,
        }),
      });

      setPrefs(prefsBuffer);
      toast({ type: "success", message: "Preferences saved", description: "Your job preferences have been updated." });
    } catch (err) {
      toast({ type: "error", message: "Error saving preferences" });
    }
  }

  async function saveNotifPrefs() {
    try {
      await apiFetch("/api/settings/notifications", {
        method: "PATCH",
        headers: authHeaders(),
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
      toast({ type: "success", message: "Notification preferences saved" });
    } catch (err) {
      toast({ type: "error", message: "Error saving notifications" });
    }
  }

  async function savePrivacy() {
    try {
      await apiFetch("/api/settings/general", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          profileVisibility: privacy.profileVisible ? "PUBLIC" : "PRIVATE",
        }),
      });
      toast({ type: "success", message: "Privacy settings saved" });
    } catch (err) {
      toast({ type: "error", message: "Error saving privacy settings" });
    }
  }

  async function deleteAccount() {
    try {
      await apiFetch("/api/auth/account", {
        method: "DELETE",
        headers: authHeaders(),
      });
      toast({ type: "error", message: "Account scheduled for deletion", description: "You will be logged out.", duration: 6000 });
      window.location.href = "/login";
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error deleting account" });
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
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <LocationSelect
                        value={prefsBuffer.location}
                        onChange={(val) => setPrefsBuffer({ ...prefsBuffer, location: val })}
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

                <Section title="Sessions & Login History" desc="Manage devices signed into your account and review past activity.">
                  <SessionsPanel />
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
                         <p className="text-xs text-slate-500 mb-4">This will schedule your account for deletion in 30 days. This cannot be undone.</p>
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
