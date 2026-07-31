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
  const primary = process.env.SUBS_SERVICE_URL || "http://127.0.0.1:4008";
  const urls = Array.from(new Set([primary, "http://subscription-service:4008", "http://gateway:5000", "http://127.0.0.1:4008"]));
  for (const base of urls) {
    try {
      const res = await fetch(`${base}/subscriptions/packages`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const body = await res.json();
      const raw = body?.data;
      if (!Array.isArray(raw) || raw.length === 0) continue;
      return raw;
    } catch {
      // try next fallback
    }
  }
  return [];
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
