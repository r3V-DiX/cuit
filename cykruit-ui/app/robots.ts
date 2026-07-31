import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cykruit.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs", "/jobs/", "/employers", "/about", "/pricing", "/contact"],
        disallow: [
          "/dashboard",
          "/profile",
          "/settings",
          "/employer/",
          "/admin/",
          "/kyc/",
          "/auth/",
          "/register/",
          "/login",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
