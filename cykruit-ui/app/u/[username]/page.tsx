import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Shield, MapPin, Globe, ExternalLink,
  Briefcase, GraduationCap, Award, Terminal, Check,
} from "lucide-react";
import { FaLinkedinIn, FaGithub, FaXTwitter } from "react-icons/fa6";
import ShareButton from "./ShareButton";

const PUBLIC_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";

async function getProfile(userId: string) {
  try {
    const res = await fetch(`${PUBLIC_URL}/public/u/${userId}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

function initials(first: string, last: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <h2 className="font-semibold text-slate-800 text-base">{label}</h2>
    </div>
  );
}

const CERT_BADGE_POOL = [
  "bg-red-50 text-red-700 border-red-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-green-50 text-green-700 border-green-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-amber-50 text-amber-700 border-amber-200",
];

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const fullName = profile.anonymity?.isAnonymous
    ? "Anonymous"
    : `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  const avatarInitials = profile.anonymity?.isAnonymous
    ? "AN"
    : initials(profile.firstName ?? "", profile.lastName ?? "");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-base tracking-tight">Cykruit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link href="/register/employer" className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Post a Job
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-4">

        {/* Hero card */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-shrink-0">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl font-bold tracking-wide">{avatarInitials}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{fullName}</h1>
                  {profile.title && <p className="text-base text-slate-500 mt-0.5">{profile.title}</p>}
                  {profile.location && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
                <ShareButton />
              </div>

              {profile.availability === "Open to offers" && !profile.anonymity?.isAnonymous && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Open to Work
                </div>
              )}

              {profile.professionalSummary && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{profile.professionalSummary}</p>
              )}

              {profile.anonymity?.isAnonymous && (
                <p className="mt-3 text-xs text-slate-400 italic">{profile.anonymity.description}</p>
              )}

              {/* Social links */}
              {!profile.anonymity?.isAnonymous && (
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  {profile.linkedin && (
                    <a href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                      <FaLinkedinIn className="w-3.5 h-3.5" /><span>LinkedIn</span>
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github.startsWith("http") ? profile.github : `https://${profile.github}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
                      <FaGithub className="w-3.5 h-3.5" /><span>GitHub</span>
                    </a>
                  )}
                  {profile.portfolio && (
                    <a href={profile.portfolio.startsWith("http") ? profile.portfolio : `https://${profile.portfolio}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                      <Globe className="w-3.5 h-3.5" /><span>Portfolio</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <Card>
            <SectionTitle icon={Check} label="Skills" />
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: { id: string; name: string }) => (
                <span key={s.id}
                  className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors">
                  {s.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Experience */}
        {profile.experiences?.length > 0 && (
          <Card>
            <SectionTitle icon={Briefcase} label="Experience" />
            <div className="space-y-5">
              {profile.experiences.map((exp: any, idx: number) => (
                <div key={exp.id} className={idx < profile.experiences.length - 1 ? "pb-5 border-b border-slate-100" : ""}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{exp.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{exp.company}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Education */}
        {profile.education?.length > 0 && (
          <Card>
            <SectionTitle icon={GraduationCap} label="Education" />
            <div className="space-y-5">
              {profile.education.map((edu: any, idx: number) => (
                <div key={edu.id} className={idx < profile.education.length - 1 ? "pb-5 border-b border-slate-100" : ""}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">
                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{edu.instituteName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </p>
                      {edu.description && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{edu.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Certifications */}
        {profile.certifications?.length > 0 && (
          <Card>
            <SectionTitle icon={Award} label="Certifications" />
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert: any, i: number) => (
                <div key={cert.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${CERT_BADGE_POOL[i % CERT_BADGE_POOL.length]}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>{cert.name}</span>
                  {(cert.organization || cert.issueDate) && (
                    <span className="text-xs opacity-70">
                      · {cert.organization}{cert.issueDate ? ` · ${formatDate(cert.issueDate)}` : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* CTF Profiles */}
        {profile.ctfProfiles?.length > 0 && (
          <Card>
            <SectionTitle icon={Terminal} label="CTF Profiles" />
            <div className="space-y-3">
              {profile.ctfProfiles.map((entry: any) => (
                <div key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{entry.platform}</p>
                      <p className="text-xs text-slate-500">@{entry.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.rank && (
                      <span className="px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                        {entry.rank}
                      </span>
                    )}
                    {entry.profileUrl && /^https?:\/\//i.test(entry.profileUrl) && (
                      <a href={entry.profileUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty state for anonymous with no sections */}
        {profile.anonymity?.isAnonymous &&
          !profile.skills?.length &&
          !profile.experiences?.length && (
          <Card>
            <p className="text-sm text-slate-400 text-center py-4">
              This candidate has chosen to keep their profile private.
            </p>
          </Card>
        )}

      </main>
    </div>
  );
}
