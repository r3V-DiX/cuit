export type AppStatus = "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Offered" | "Hired" | "Rejected" | "Withdrawn";

export type TimelineEvent = { date: string; event: string; note?: string };

export type Application = {
  id: number;
  role: string;
  company: string;
  location: string;
  type: string;
  applied: string;
  status: AppStatus;
  resume: string;
  coverNote?: string;
  timeline: TimelineEvent[];
};

export const SEED: Application[] = [
  {
    id: 1,
    role: "Senior Penetration Tester",
    company: "CrowdStrike",
    location: "Remote",
    type: "Full-time",
    applied: "Jun 14, 2025",
    status: "Shortlisted",
    resume: "Red Team Roles",
    coverNote: "Excited about CrowdStrike's adversarial simulation work. My OSCP background and 5 years of client-facing pentests align well with this role.",
    timeline: [
      { date: "Jun 14", event: "Application submitted" },
      { date: "Jun 16", event: "Application viewed by recruiter" },
      { date: "Jun 19", event: "Moved to shortlist", note: "Recruiter reached out via email" },
    ],
  },
  {
    id: 2,
    role: "Cloud Security Engineer",
    company: "Palo Alto Networks",
    location: "Hybrid · NYC",
    type: "Full-time",
    applied: "Jun 11, 2025",
    status: "Under Review",
    resume: "General Application",
    coverNote: "Strong interest in Palo Alto's Prisma Cloud platform. I bring hands-on AWS security experience and cloud pentesting background.",
    timeline: [
      { date: "Jun 11", event: "Application submitted" },
      { date: "Jun 13", event: "Under review by hiring team" },
    ],
  },
  {
    id: 3,
    role: "SOC Analyst II",
    company: "Mandiant",
    location: "On-site · DC",
    type: "Full-time",
    applied: "Jun 8, 2025",
    status: "Applied",
    resume: "General Application",
    coverNote: "Mandiant's threat intelligence reputation is unmatched. My Splunk and QRadar experience from Wipro will be a strong fit for the SOC team.",
    timeline: [
      { date: "Jun 8", event: "Application submitted" },
    ],
  },
  {
    id: 4,
    role: "Red Team Operator",
    company: "Microsoft",
    location: "Remote",
    type: "Full-time",
    applied: "Jun 5, 2025",
    status: "Applied",
    resume: "Red Team Roles",
    coverNote: "Microsoft's MORSE team is one of the most respected red teams globally. I would bring deep offensive tooling knowledge and experience across cloud environments.",
    timeline: [
      { date: "Jun 5", event: "Application submitted" },
      { date: "Jun 7", event: "Application viewed by recruiter" },
    ],
  },
  {
    id: 5,
    role: "AppSec Engineer",
    company: "Stripe",
    location: "Hybrid · SF",
    type: "Full-time",
    applied: "May 28, 2025",
    status: "Rejected",
    resume: "General Application",
    coverNote: "Stripe's security culture and focus on developer tooling is compelling. My web application pentesting background covers the OWASP Top 10 in depth.",
    timeline: [
      { date: "May 28", event: "Application submitted" },
      { date: "Jun 2", event: "Application reviewed" },
      { date: "Jun 6", event: "Not selected", note: "Position filled internally" },
    ],
  },
  {
    id: 6,
    role: "Threat Intel Analyst",
    company: "Recorded Future",
    location: "Remote",
    type: "Contract",
    applied: "May 20, 2025",
    status: "Rejected",
    resume: "General Application",
    coverNote: "Recorded Future's intelligence platform is industry-leading. My background in threat actor tracking and IOC analysis aligns with this role.",
    timeline: [
      { date: "May 20", event: "Application submitted" },
      { date: "May 25", event: "Interview scheduled" },
      { date: "May 30", event: "Interview completed" },
      { date: "Jun 3", event: "Not selected", note: "Went with a candidate with more years of dedicated OSINT experience" },
    ],
  },
];
