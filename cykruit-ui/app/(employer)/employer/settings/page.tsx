"use client";

import { useState, useEffect } from "react";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  User, Bell, Shield, Check,
  Mail, Smartphone, Info, Trash2, Lock,
  Building2, ChevronDown, Loader2,
} from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";
import { SessionsPanel } from "@/components/settings/SessionsPanel";
import { useSessionGuard } from "@/lib/use-session-guard";

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
  { id: "security",      label: "Security",      icon: Shield    },
];

const SIZES: { value: string; label: string }[] = [
  { value: "SIZE_1_10",      label: "1–10 employees"      },
  { value: "SIZE_11_50",     label: "11–50 employees"     },
  { value: "SIZE_51_200",    label: "51–200 employees"    },
  { value: "SIZE_201_500",   label: "201–500 employees"   },
  { value: "SIZE_501_1000",  label: "501–1000 employees"  },
  { value: "SIZE_1000_PLUS", label: "1000+ employees"     },
];

interface SubSummary {
  hasSubscription: boolean;
  effectiveStatus?: string;
  expiresAt?: string;
  packageName?: string;
  billingCycle?: string;
  limits?: {
    maxActiveJobs: number;
    maxTeamMembers: number;
    featuredJobSlots: number;
    aiScoringEnabled: boolean;
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployerSettingsPage() {
  const { toast } = useToast();
  const { openModal } = useModal();
  const [tab, setTab]= useState("account");
  const [loading, setLoading] = useState(true);
  useSessionGuard();

  // Account
  const [locked, setLocked] = useState({ name: "", email: "" });

  // General / privacy
  const [profileVisibility, setProfileVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [showCompanyDetails, setShowCompanyDetails] = useState(true);

  // Company basics
  const [companySize, setCompanySize] = useState("SIZE_51_200");
  const [contactEmail, setContactEmail] = useState("");

  // Subscription summary
  const [subSummary, setSubSummary] = useState<SubSummary | null>(null);

  // Notifications — keys match UpdateEmployerNotificationsDto
  const [notifs, setNotifs] = useState({
    enableEmail:              true,
    enableInApp:              true,
    newApplicant_email:       true,
    newApplicant_inApp:       true,
    applicationUpdate_email:  true,
    applicationUpdate_inApp:  true,
    jobExpiryAlert_email:     true,
    jobExpiryAlert_inApp:     true,
    platformAnnouncement_email: false,
    platformAnnouncement_inApp: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const [me, s, companyRes, subRes] = await Promise.all([
          apiFetch<{ firstName?: string; lastName?: string; name?: string; fullName?: string; email?: string }>("/api/auth/me"),
          apiFetch<{ notifications?: Record<string, unknown>; profileVisibility?: "PUBLIC" | "PRIVATE"; showCompanyDetailsBeforeApply?: boolean }>("/api/settings/employer"),
          apiFetch<{ companySize?: string; contactEmail?: string }>("/api/employer/company/me").catch(() => null),
          apiFetch<SubSummary>("/api/subscriptions/usage").catch(() => null),
        ]);
        const u = me?.data;
        if (u) {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
          setLocked({ name: fullName || u.name || u.fullName || "", email: u.email ?? "" });
        }
        const d = s?.data;
        if (d) {
          if (d.notifications !== undefined) setNotifs((prev) => ({ ...prev, ...(d.notifications as typeof prev) }));
          if (d.profileVisibility)                          setProfileVisibility(d.profileVisibility);
          if (d.showCompanyDetailsBeforeApply !== undefined) setShowCompanyDetails(d.showCompanyDetailsBeforeApply);
        }
        if (companyRes) {
          const c = companyRes.data;
          if (c?.companySize)   setCompanySize(c.companySize);
          if (c?.contactEmail)  setContactEmail(c.contactEmail);
        }
        if (subRes?.data) setSubSummary(subRes.data);
      } catch {
        // silent — fields remain at defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function saveCompany() {
    try {
      await apiFetch("/api/employer/company/basic", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          companySize: companySize || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      });
      toast({ type: "success", message: "Company settings saved" });
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to save settings") });
    }
  }

  async function saveGeneral() {
    try {
      await apiFetch("/api/settings/employer/general", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ profileVisibility, showCompanyDetailsBeforeApply: showCompanyDetails }),
      });
      toast({ type: "success", message: "Privacy settings saved" });
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to save settings") });
    }
  }

  async function saveNotifs() {
    try {
      await apiFetch("/api/settings/employer/notifications", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(notifs),
      });
      toast({ type: "success", message: "Notification preferences saved" });
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to save preferences") });
    }
  }

  function confirmDeleteAccount() {
    openModal({
      variant: "danger",
      title: "Delete Account",
      description: "This will permanently delete your employer account and all associated data. This action cannot be undone.",
      confirmLabel: "Delete Account",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await apiFetch("/api/auth/account", {
            method: "DELETE",
            headers: authHeaders(),
          });
          toast({ type: "error", message: "Account scheduled for deletion", description: "You will be logged out.", duration: 6000 });
          window.location.href = "/login";
        } catch (err: unknown) {
          toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to delete account") });
        }
      },
    });
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
          <div className="w-full md:w-52 md:shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-row md:flex-col gap-0.5 overflow-x-auto md:sticky md:top-0">
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


                <Section title="Plan & Billing" desc="Your current subscription plan and billing details.">
                  {subSummary ? (
                    <div className="flex items-start justify-between p-4 rounded-xl border border-violet-200 bg-violet-50/50 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {subSummary.hasSubscription && subSummary.packageName ? `${subSummary.packageName} Plan` : "Free Tier"}
                          </p>
                          {subSummary.hasSubscription && subSummary.effectiveStatus && (
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                              subSummary.effectiveStatus === "ACTIVE" ? "text-violet-700 bg-violet-100 border-violet-200"
                              : subSummary.effectiveStatus === "CANCELLED" ? "text-slate-600 bg-slate-100 border-slate-200"
                              : "text-amber-700 bg-amber-100 border-amber-200"
                            }`}>{subSummary.effectiveStatus.charAt(0) + subSummary.effectiveStatus.slice(1).toLowerCase()}</span>
                          )}
                        </div>
                        {subSummary.hasSubscription && subSummary.expiresAt && (
                          <p className="text-xs text-slate-500 mb-2">
                            {subSummary.billingCycle === "YEARLY" ? "Billed annually" : "Billed monthly"}
                            {" · "}
                            {subSummary.effectiveStatus === "CANCELLED" ? "Expires" : "Renews"} {subSummary.expiresAt.slice(0, 10)}
                          </p>
                        )}
                        {subSummary.limits && (
                          <ul className="space-y-1">
                            {[
                              `${subSummary.limits.maxActiveJobs} active job listings`,
                              `${subSummary.limits.maxTeamMembers} team members`,
                              subSummary.limits.featuredJobSlots > 0 ? `${subSummary.limits.featuredJobSlots} featured slots` : null,
                              subSummary.limits.aiScoringEnabled ? "AI candidate scoring" : null,
                            ].filter(Boolean).map((f) => (
                              <li key={f as string} className="flex items-center gap-2 text-xs text-slate-500">
                                <Check className="w-3 h-3 text-green-500 shrink-0" />{f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <a href="/employer/subscription" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shrink-0">
                        Manage →
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 mb-4">
                      <p className="text-sm text-slate-400">Loading plan details…</p>
                      <a href="/employer/subscription" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shrink-0">
                        Manage →
                      </a>
                    </div>
                  )}
                  <a href="/employer/subscription?tab=history" className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    View billing history & invoices →
                  </a>
                </Section>

                <Section title="Privacy" desc="Control how your employer profile appears to candidates.">
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Profile Visibility</label>
                      <div className="relative max-w-xs">
                        <select
                          value={profileVisibility}
                          onChange={(e) => setProfileVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                          className={selectCls}
                        >
                          <option value="PUBLIC">Public — visible to all candidates</option>
                          <option value="PRIVATE">Private — hidden from search</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 max-w-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Show company details before applying</p>
                        <p className="text-xs text-slate-400 mt-0.5">Candidates see your full company profile before they submit an application</p>
                      </div>
                      <Toggle on={showCompanyDetails} onChange={setShowCompanyDetails} />
                    </div>
                    <button onClick={saveGeneral} className={saveBtnCls}>
                      <Check className="w-3.5 h-3.5" /> Save Privacy Settings
                    </button>
                  </div>
                </Section>

                <Section title="Danger Zone" desc="Permanent actions that cannot be undone.">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                    <div>
                      <p className="text-sm font-semibold text-red-700">Delete Account</p>
                      <p className="text-xs text-red-400 mt-0.5">Permanently delete your employer account and all associated data.</p>
                    </div>
                    <button onClick={confirmDeleteAccount}
                      className="mt-3 sm:mt-0 flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
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
                          <option value="">Select size…</option>
                          {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Public Contact Email</label>
                      <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hiring@company.com" className={inputCls} />
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
                      { key: "newApplicant_email",       label: "New application received",    desc: "Someone applies to one of your open roles"       },
                      { key: "applicationUpdate_email",  label: "Applicant stage changes",     desc: "When you or a teammate moves an applicant"       },
                      { key: "jobExpiryAlert_email",     label: "Job listing expiry alerts",   desc: "3 days before a listing expires"                 },
                      { key: "platformAnnouncement_email", label: "Platform announcements",    desc: "News, feature releases, and tips from Cykruit"   },
                    ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <ToggleRow key={key} label={label} desc={desc}
                        on={notifs[key] as boolean}
                        onChange={(v) => setNotifs({ ...notifs, [key]: v })} />
                    ))}
                  </div>
                </Section>

                <Section title="In-App Alerts" desc="Notifications shown inside the dashboard.">
                  <div className="space-y-0 -mx-6 -mt-4">
                    {([
                      { key: "newApplicant_inApp",       label: "New application received",   desc: "In-app alert when someone applies"               },
                      { key: "applicationUpdate_inApp",  label: "Applicant stage changes",    desc: "In-app alert when a stage changes"               },
                      { key: "jobExpiryAlert_inApp",     label: "Job listing expiry alerts",  desc: "In-app alert 3 days before expiry"               },
                      { key: "platformAnnouncement_inApp", label: "Platform announcements",   desc: "In-app news and product updates"                 },
                    ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <ToggleRow key={key} label={label} desc={desc}
                        on={notifs[key] as boolean}
                        onChange={(v) => setNotifs({ ...notifs, [key]: v })} />
                    ))}
                  </div>
                </Section>

                <Section title="Delivery Channels" desc="Master switches for each delivery method.">
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
                      <Toggle on={notifs.enableEmail} onChange={(v) => setNotifs({ ...notifs, enableEmail: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">In-app notifications</p>
                          <p className="text-xs text-slate-400">Alerts inside the dashboard</p>
                        </div>
                      </div>
                      <Toggle on={notifs.enableInApp} onChange={(v) => setNotifs({ ...notifs, enableInApp: v })} />
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

            {/* ── SECURITY ── */}
            {tab === "security" && (
              <div>
                <Section title="Sessions & Login History" desc="Manage devices signed into your account and review past activity.">
                  <SessionsPanel />
                </Section>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
