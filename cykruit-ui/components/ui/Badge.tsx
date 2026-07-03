import { type ReactNode } from "react";

type Variant = "blue" | "cyan" | "green" | "amber" | "subtle" | "blue-dark" | "cyan-dark";

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  /* Light-background variants */
  blue: "bg-blue-50 text-blue-600 border border-blue-100",
  cyan: "bg-cyan-50 text-cyan-600 border border-cyan-100",
  green: "bg-green-50 text-green-600 border border-green-100",
  amber: "bg-amber-50 text-amber-600 border border-amber-100",
  subtle: "bg-slate-100 text-slate-600 border border-slate-200",
  /* Dark-background variants (used in dark sections like ForEmployers mock card) */
  "blue-dark": "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "cyan-dark": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
};

export default function Badge({ children, variant = "blue", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
