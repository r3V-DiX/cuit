import React from "react";
import {
  Send,
  Eye,
  Sparkles,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";

export type ApplicationLifecycleStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export interface StatusConfigItem {
  key: ApplicationLifecycleStatus;
  label: string;
  color: string;
  dot: string;
  border: string;
  bg: string;
  textColor: string;
  icon: React.ReactElement;
}

export const APPLICATION_STATUS_MAP: Record<ApplicationLifecycleStatus, StatusConfigItem> = {
  APPLIED: {
    key: "APPLIED",
    label: "Applied",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    border: "border-blue-200",
    bg: "bg-blue-50",
    textColor: "text-blue-700",
    icon: <Send className="w-3 h-3" />,
  },
  UNDER_REVIEW: {
    key: "UNDER_REVIEW",
    label: "Under Review",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    border: "border-amber-200",
    bg: "bg-amber-50",
    textColor: "text-amber-700",
    icon: <Eye className="w-3 h-3" />,
  },
  SHORTLISTED: {
    key: "SHORTLISTED",
    label: "Shortlisted",
    color: "text-teal-700 bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
    border: "border-teal-200",
    bg: "bg-teal-50",
    textColor: "text-teal-700",
    icon: <Sparkles className="w-3 h-3" />,
  },
  INTERVIEW: {
    key: "INTERVIEW",
    label: "Interview",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    textColor: "text-indigo-700",
    icon: <Calendar className="w-3 h-3" />,
  },
  OFFERED: {
    key: "OFFERED",
    label: "Offered",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    textColor: "text-emerald-700",
    icon: <Award className="w-3 h-3" />,
  },
  HIRED: {
    key: "HIRED",
    label: "Hired",
    color: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
    border: "border-green-200",
    bg: "bg-green-50",
    textColor: "text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  REJECTED: {
    key: "REJECTED",
    label: "Rejected",
    color: "text-rose-700 bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
    border: "border-rose-200",
    bg: "bg-rose-50",
    textColor: "text-rose-700",
    icon: <XCircle className="w-3 h-3" />,
  },
  WITHDRAWN: {
    key: "WITHDRAWN",
    label: "Withdrawn",
    color: "text-slate-600 bg-slate-100 border-slate-200",
    dot: "bg-slate-400",
    border: "border-slate-200",
    bg: "bg-slate-100",
    textColor: "text-slate-600",
    icon: <Minus className="w-3 h-3" />,
  },
};

export function normalizeApplicationStatus(rawStatus: string): ApplicationLifecycleStatus {
  if (!rawStatus) return "APPLIED";
  const normalized = rawStatus.toUpperCase().replace(/[\s-]/g, "_");

  switch (normalized) {
    case "NEW":
    case "APPLIED":
      return "APPLIED";
    case "UNDER_REVIEW":
    case "REVIEW":
      return "UNDER_REVIEW";
    case "SHORTLISTED":
      return "SHORTLISTED";
    case "INTERVIEW":
    case "INTERVIEWING":
      return "INTERVIEW";
    case "OFFERED":
    case "OFFER":
      return "OFFERED";
    case "HIRED":
    case "ACCEPTED":
      return "HIRED";
    case "REJECTED":
    case "DECLINED":
      return "REJECTED";
    case "WITHDRAWN":
      return "WITHDRAWN";
    default:
      return "APPLIED";
  }
}

export function getApplicationStatusConfig(rawStatus: string): StatusConfigItem {
  const status = normalizeApplicationStatus(rawStatus);
  return APPLICATION_STATUS_MAP[status];
}

interface ApplicationStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export default function ApplicationStatusBadge({
  status,
  size = "sm",
  showDot = false,
  className = "",
}: ApplicationStatusBadgeProps) {
  const cfg = getApplicationStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-lg border transition-colors ${cfg.color} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      } ${className}`}
    >
      {showDot ? (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      ) : (
        <span className="shrink-0">{cfg.icon}</span>
      )}
      <span>{cfg.label}</span>
    </span>
  );
}
