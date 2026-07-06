import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:4001/auth/:path*",
      },
      {
        source: "/api/settings/:path*",
        destination: "http://localhost:4002/settings/:path*",
      },
      {
        source: "/api/profile/experiences/:path*",
        destination: "http://localhost:4003/experiences/:path*",
      },
      {
        source: "/api/profile/education/:path*",
        destination: "http://localhost:4003/education/:path*",
      },
      {
        source: "/api/profile/skills/:path*",
        destination: "http://localhost:4003/skills/:path*",
      },
      {
        source: "/api/profile/certifications/:path*",
        destination: "http://localhost:4003/certifications/:path*",
      },
      {
        source: "/api/profile/projects/:path*",
        destination: "http://localhost:4003/projects/:path*",
      },
      {
        source: "/api/profile/ctf-profiles/:path*",
        destination: "http://localhost:4003/ctf-profiles/:path*",
      },
      {
        source: "/api/profile/resumes/:path*",
        destination: "http://localhost:4003/resumes/:path*",
      },
      {
        source: "/api/profile/:path*",
        destination: "http://localhost:4003/profile/:path*",
      },
      {
        source: "/api/employer/:path*",
        destination: "http://localhost:4004/employer/:path*",
      },
      {
        source: "/api/public/:path*",
        destination: "http://localhost:4006/public/:path*",
      },
    ];
  },
};

export default nextConfig;
