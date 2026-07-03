"use client";

import Link from "next/link";
import {
  Shield,
  MapPin,
  Globe,
  ExternalLink,
  Share2,

  Briefcase,
  GraduationCap,
  Award,
  Terminal,
  Check,
} from "lucide-react";
import { FaLinkedinIn, FaGithub, FaXTwitter } from "react-icons/fa6";

// ─── Seed data ────────────────────────────────────────────────────────────────

const PROFILE = {
  name: "Aryan Mehta",
  initials: "AM",
  title: "Senior Penetration Tester",
  location: "Mumbai, India",
  bio: "Offensive security professional with 5+ years specializing in web application and network penetration testing. OSCP certified. Active on HackTheBox (Pro Hacker) and TryHackMe (Top 5%). Passionate about red team operations and adversarial simulation.",
  openToWork: true,
  social: {
    linkedin: "linkedin.com/in/aryanmehta",
    github: "github.com/aryan-htb",
    portfolio: "",
    twitter: "",
  },
};

const SKILLS = [
  "Penetration Testing",
  "Burp Suite",
  "Metasploit",
  "OSCP",
  "Python",
  "Nmap",
  "AWS Security",
  "Red Team",
  "Kali Linux",
  "OWASP",
];

const EXPERIENCE = [
  {
    id: 1,
    role: "Senior Penetration Tester",
    company: "SecureLayer7",
    period: "Jan 2022 – Present",
    desc: "Led web application and network pentests for Fortune 500 clients. Authored 40+ detailed pentest reports.",
  },
  {
    id: 2,
    role: "Security Analyst",
    company: "Wipro CyberSecurity",
    period: "Jun 2019 – Dec 2021",
    desc: "SOC analyst handling L2 escalations. Built detection rules in Splunk and QRadar for 200+ use cases.",
  },
];

const EDUCATION = [
  {
    id: 1,
    degree: "B.Tech in Computer Science",
    school: "VIT University",
    startYear: "2015",
    endYear: "2019",
    desc: "Specialization in Information Security. Final year project on network intrusion detection using ML.",
  },
];

const CERTS = [
  {
    id: 1,
    name: "OSCP",
    issuer: "Offensive Security",
    year: "2022",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: 2,
    name: "CEH",
    issuer: "EC-Council",
    year: "2021",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: 3,
    name: "CompTIA Security+",
    issuer: "CompTIA",
    year: "2019",
    badge: "bg-green-50 text-green-700 border-green-200",
  },
];

const CTF = [
  {
    id: 1,
    platform: "HackTheBox",
    handle: "@aryan_htb",
    rank: "Pro Hacker",
    rankColor: "text-green-700 bg-green-50 border-green-200",
    url: "https://www.hackthebox.com",
  },
  {
    id: 2,
    platform: "TryHackMe",
    handle: "@aryanm",
    rank: "Top 5%",
    rankColor: "text-blue-700 bg-blue-50 border-blue-200",
    url: "https://tryhackme.com",
  },
];

// ─── Top Nav ──────────────────────────────────────────────────────────────────

function TopNav() {
  return (
    <nav className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-base tracking-tight">Cykruit</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register/employer"
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <h2 className="font-semibold text-slate-800 text-base">{label}</h2>
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function HeroCard() {
  const { name, initials, title, location, bio, openToWork, social } = PROFILE;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
            <span className="text-white text-2xl font-bold tracking-wide">{initials}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{name}</h1>
              <p className="text-base text-slate-500 mt-0.5">{title}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{location}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Open to work badge */}
          {openToWork && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Open to Work
            </div>
          )}

          {/* Bio */}
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{bio}</p>

          {/* Social links */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {social.linkedin && (
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <FaLinkedinIn className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
            )}
            {social.github && (
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                <FaGithub className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}
            {social.portfolio && (
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </a>
            )}
            {social.twitter && (
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-500 transition-colors"
              >
                <FaXTwitter className="w-3.5 h-3.5" />
                <span>Twitter</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Skills card ─────────────────────────────────────────────────────────────

function SkillsCard() {
  return (
    <Card>
      <SectionTitle icon={Check} label="Skills" />
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
          >
            {skill}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─── Experience card ──────────────────────────────────────────────────────────

function ExperienceCard() {
  return (
    <Card>
      <SectionTitle icon={Briefcase} label="Experience" />
      <div className="space-y-5">
        {EXPERIENCE.map((exp, idx) => (
          <div key={exp.id} className={idx < EXPERIENCE.length - 1 ? "pb-5 border-b border-slate-100" : ""}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{exp.role}</p>
                <p className="text-sm text-slate-500 mt-0.5">{exp.company}</p>
                <p className="text-xs text-slate-400 mt-0.5">{exp.period}</p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Education card ───────────────────────────────────────────────────────────

function EducationCard() {
  return (
    <Card>
      <SectionTitle icon={GraduationCap} label="Education" />
      <div className="space-y-5">
        {EDUCATION.map((edu) => (
          <div key={edu.id} className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{edu.degree}</p>
              <p className="text-sm text-slate-500 mt-0.5">{edu.school}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {edu.startYear} – {edu.endYear}
              </p>
              {edu.desc && (
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{edu.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Certifications card ──────────────────────────────────────────────────────

function CertificationsCard() {
  return (
    <Card>
      <SectionTitle icon={Award} label="Certifications" />
      <div className="flex flex-wrap gap-2">
        {CERTS.map((cert) => (
          <div
            key={cert.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${cert.badge}`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{cert.name}</span>
            <span className="text-xs opacity-70">· {cert.issuer} · {cert.year}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── CTF Profiles card ────────────────────────────────────────────────────────

function CTFCard() {
  return (
    <Card>
      <SectionTitle icon={Terminal} label="CTF Profiles" />
      <div className="space-y-3">
        {CTF.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{entry.platform}</p>
                <p className="text-xs text-slate-500">{entry.handle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${entry.rankColor}`}
              >
                {entry.rank}
              </span>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <main className="max-w-5xl mx-auto p-6 space-y-4">
        <HeroCard />
        <SkillsCard />
        <ExperienceCard />
        <EducationCard />
        <CertificationsCard />
        <CTFCard />
      </main>
    </div>
  );
}
