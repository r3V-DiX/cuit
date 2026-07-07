import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://127.0.0.1:4001/auth/:path*",
      },
      {
        source: "/api/settings/:path*",
        destination: "http://127.0.0.1:4002/settings/:path*",
      },
      {
        source: "/api/profile/experiences/:path*",
        destination: "http://127.0.0.1:4003/experiences/:path*",
      },
      {
        source: "/api/profile/education/:path*",
        destination: "http://127.0.0.1:4003/education/:path*",
      },
      {
        source: "/api/profile/skills/:path*",
        destination: "http://127.0.0.1:4003/skills/:path*",
      },
      {
        source: "/api/profile/certifications/:path*",
        destination: "http://127.0.0.1:4003/certifications/:path*",
      },
      {
        source: "/api/profile/projects/:path*",
        destination: "http://127.0.0.1:4003/projects/:path*",
      },
      {
        source: "/api/profile/ctf-profiles/:path*",
        destination: "http://127.0.0.1:4003/ctf-profiles/:path*",
      },
      {
        source: "/api/profile/resumes/:path*",
        destination: "http://127.0.0.1:4003/resumes/:path*",
      },
      {
        source: "/api/profile/:path*",
        destination: "http://127.0.0.1:4003/profile/:path*",
      },
      {
        source: "/api/employer/:path*",
        destination: "http://127.0.0.1:4004/employer/:path*",
      },
      {
        source: "/api/seeker/:path*",
        destination: "http://127.0.0.1:4005/:path*",
      },
      {
        source: "/api/public/:path*",
        destination: "http://127.0.0.1:4006/public/:path*",
      },
    ];
  },
};

export default nextConfig;
