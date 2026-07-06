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
