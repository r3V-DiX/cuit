import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cykruit.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`,          lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/jobs`,      lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/employers`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/pricing`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  return staticRoutes;
}
