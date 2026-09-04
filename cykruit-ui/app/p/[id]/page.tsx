"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders, describeError } from "@/lib/api";
import {
  MapPin, Briefcase, Calendar, Award, Terminal,
  GraduationCap, Globe, Shield, Sparkles, Copy, Check,
  Share2, Lock, ArrowLeft, ExternalLink, ArrowRight,
  CheckCircle2, User, Loader2, FileText, Code2, AlertTriangle,
} from "lucide-react";
import { FaLinkedinIn, FaGithub, FaXTwitter } from "react-icons/fa6";

interface SkillItem {
  id: string;
  name: string;
  category: string | null;
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string | null;
}

interface EducationItem {
  id: string;
  degree: string;
  fieldOfStudy?: string | null;
  instituteName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  grade?: string | null;
  description?: string | null;
}

interface CertItem {
  id: string;
  name: string;
  organization: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
}

interface ProjectItem {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  technologies?: string[];
}

interface CtfItem {
  id: string;
  platform: string;
  handle: string;
  profileUrl?: string | null;
  rating?: string | number | null;
  rank?: string | number | null;
}

interface PublicProfileData {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string | null;
  title?: string;
  professionalSummary?: string;
  location?: string | null;
  availability?: string;
  profileCompletion?: number;
  createdAt?: string;
  skills?: SkillItem[];
  experiences?: ExperienceItem[];
  education?: EducationItem[];
  certifications?: CertItem[];
  projects?: ProjectItem[];
  ctfProfiles?: CtfItem[];
  isPrivate?: boolean;
  isOwner?: boolean;
  message?: string;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Present";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  useEffect(() => {
    async function loadPublicProfile() {
      try {
        const res = await apiFetch<PublicProfileData>(`/api/public/u/${id}`, {
          skipAuthRedirect: true,
          skipLogoutOn401: true,
        });
        if (res.data) {
          setProfile(res.data);
        } else if (res.message && res.message.toLowerCase().includes("private")) {
          setProfile({ id, isPrivate: true, message: res.message });
        } else {
          setProfile(null);
        }
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.status === 404 || err?.statusCode === 403 || err?.status === 403) {
          setProfile({ id, isPrivate: true, message: "This profile is private or does not exist." });
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPublicProfile();
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ type: "success", message: "Public link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMakePublic = async () => {
    setTogglingVisibility(true);
    try {
      await apiFetch("/api/settings/general", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ profileVisibility: "PUBLIC" }),
      });
      setProfile((prev) => (prev ? { ...prev, isPrivate: false } : null));
      toast({ type: "success", message: "Your profile is now public and shareable!" });
    } catch (err) {
      toast({ type: "error", ...describeError(err, "Failed to update visibility") });
    } finally {
      setTogglingVisibility(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 animate-pulse mb-3">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-500 font-mono">Loading profile…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // If profile is set to Private and viewer is NOT the owner
  if (profile?.isPrivate && !profile.isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl shadow-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Private Profile
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-3 mb-2">This profile is currently private</h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              The candidate has set their profile visibility to private. Check back later or explore open cybersecurity roles on Cykruit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" /> Explore Jobs
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Return Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-slate-900 mb-1">Profile Not Found</h1>
            <p className="text-sm text-slate-500 mb-4">The profile you are looking for does not exist or has been removed.</p>
            <Link href="/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
              ← Return to jobs board
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Cybersecurity Professional";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      <Navbar />

      {/* Owner preview banner if owner is previewing their own profile */}
      {profile.isOwner && (
        <div className={`border-b px-4 py-2.5 text-xs transition-colors ${
          profile.isPrivate ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-blue-50 border-blue-200 text-blue-900"
        }`}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {profile.isPrivate ? (
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <p>
                <strong className="font-semibold">Candidate Preview:</strong>{" "}
                {profile.isPrivate
                  ? "Your profile is set to Private. Only you can view this preview. External visitors cannot see this link."
                  : "Your profile is Public. Anyone with this link can view your verified showcase."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {profile.isPrivate ? (
                <button
                  onClick={handleMakePublic}
                  disabled={togglingVisibility}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {togglingVisibility ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                  Make Profile Public
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-green-700 bg-green-100/80 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> LIVE
                </span>
              )}
              <Link
                href="/profile"
                className="text-[11px] font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Browse Jobs
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? "Copied Link" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> OPEN TO WORK
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  <Shield className="w-3 h-3" /> CYKRUIT VERIFIED
                </span>
              </div>
              <p className="text-base font-medium text-slate-600 mt-1">{profile.title || "Cybersecurity Professional"}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 flex-wrap">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Active Candidate
                </span>
                {profile.availability && (
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {profile.availability}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About / Summary */}
            {profile.professionalSummary && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-600" /> About
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {profile.professionalSummary}
                </p>
              </div>
            )}

            {/* Experience */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Experience
                </h2>
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="relative pl-8 group">
                      <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs ring-4 ring-blue-50" />
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                        <h3 className="text-base font-bold text-slate-900">{exp.title}</h3>
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          {formatDate(exp.startDate)} — {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-600 mb-2">
                        {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects & Portfolio */}
            {profile.projects && profile.projects.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-blue-600" /> Projects & Research
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.projects.map((proj) => (
                    <div key={proj.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                          {proj.url && (
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-3">
                            {proj.description}
                          </p>
                        )}
                      </div>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {proj.technologies.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Education
                </h2>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                        <h3 className="text-sm font-bold text-slate-900">{edu.degree}</h3>
                        <span className="text-xs font-mono text-slate-400">
                          {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        {edu.instituteName}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </p>
                      {edu.description && (
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            
            {/* Verified Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-teal-600" /> Verified Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs font-mono font-medium px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 transition-colors"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-emerald-600" /> Certifications
                </h2>
                <div className="space-y-3">
                  {profile.certifications.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70">
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.organization}</p>
                      {c.issueDate && (
                        <p className="text-[10px] font-mono text-slate-400 mt-1">Issued {formatDate(c.issueDate)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTF Profiles */}
            {profile.ctfProfiles && profile.ctfProfiles.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Terminal className="w-4 h-4 text-indigo-600" /> CTF Platforms
                </h2>
                <div className="space-y-2.5">
                  {profile.ctfProfiles.map((ctf) => (
                    <div key={ctf.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{ctf.platform}</p>
                        <p className="text-[11px] text-slate-500 font-mono">@{ctf.handle}</p>
                      </div>
                      {ctf.profileUrl && (
                        <a
                          href={ctf.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust & Verification Card */}
            <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50/70 to-indigo-50/50 p-6 text-center shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Cykruit Candidate Guarantee</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Contact information is shielded to prevent spam. Verified employers can connect directly through Cykruit application workflows.
              </p>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
