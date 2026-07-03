import jobsJson from "@/public/data/jobs.json";

export type Job = {
  id: number;
  title: string;
  company: string;
  logo: string;
  accent: string;
  location: string;
  remote: "Remote" | "Hybrid" | "On-site";
  type: "Full-time" | "Contract" | "Part-time";
  domain: string;
  tags: string[];
  posted: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  companyDescription: string;
  companySize: string;
  companyIndustry: string;
};

export const jobs: Job[] = jobsJson as Job[];

export const domains = [
  "All",
  "Offensive Security",
  "Cloud Security",
  "Blue Team / SOC",
  "Application Security",
  "Threat Intelligence",
  "Identity & Access",
  "DevSecOps",
  "Incident Response",
  "Governance & Compliance",
];

export function inferDomain(title: string): string {
  const t = title.toLowerCase();
  if (/devsecops|pipeline security|ci\/cd sec/.test(t)) return "DevSecOps";
  if (/cloud|aws|azure|gcp|cspm/.test(t)) return "Cloud Security";
  if (/penetrat|red team|offensive|exploit|pentest|bug bounty|vulnerability researcher/.test(t)) return "Offensive Security";
  if (/soc analyst|blue team|threat hunt|siem|detection engineer/.test(t)) return "Blue Team / SOC";
  if (/appsec|application sec|secure code/.test(t)) return "Application Security";
  if (/incident response|dfir|forensic/.test(t)) return "Incident Response";
  if (/threat intel|malware analyst|reverse engineer/.test(t)) return "Threat Intelligence";
  if (/identity|iam|access management|privileged access/.test(t)) return "Identity & Access";
  if (/grc|governance|compliance|audit|risk analyst/.test(t)) return "Governance & Compliance";
  if (/soc |security operations/.test(t)) return "Blue Team / SOC";
  return "";
}

export const jobTypes = ["All", "Full-time", "Contract", "Part-time"];
export const remoteTypes = ["All", "Remote", "Hybrid", "On-site"];
