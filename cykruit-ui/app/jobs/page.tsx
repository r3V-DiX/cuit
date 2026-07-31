import type { Metadata } from "next";
import { Suspense } from "react";
import JobsClient from "./JobsClient";

export const metadata: Metadata = {
  title: "Browse Cybersecurity Jobs",
  description:
    "Search thousands of cybersecurity jobs — penetration testing, SOC analyst, threat intelligence, cloud security, and more. Filter by role, location, and experience level.",
  alternates: { canonical: "/jobs" },
  openGraph: { url: "/jobs" },
};

export default function JobsPage() {
  return (
    <Suspense>
      <JobsClient />
    </Suspense>
  );
}
