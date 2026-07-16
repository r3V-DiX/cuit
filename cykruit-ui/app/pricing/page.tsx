import PricingClient, { PricingPackage } from "./PricingClient";

const SUBS_URL = process.env.SUBS_SERVICE_URL || "http://127.0.0.1:4008";

async function getPackages(): Promise<PricingPackage[]> {
  try {
    const res = await fetch(`${SUBS_URL}/subscriptions/packages`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const raw = body?.data;
    return Array.isArray(raw) ? raw : [];
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
