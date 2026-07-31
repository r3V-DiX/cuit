import type { Metadata } from "next";
import PricingClient, { PricingPackage } from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for cybersecurity employers. Free plan available. Upgrade for AI scoring, resume access, and advanced analytics.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing" },
};

async function getPackages(): Promise<PricingPackage[]> {
  const SUBS_URL = process.env.SUBS_SERVICE_URL || "http://127.0.0.1:4008";
  try {
    const res = await fetch(`${SUBS_URL}/subscriptions/packages`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const raw = body?.data;
    // Don't cache an empty response — service may have been temporarily down
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw;
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const packages = await getPackages();
  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none bg-grid-faint" />
      <PricingClient packages={packages} />
    </div>
  );
}
