import type { NextConfig } from "next";

const ADMIN_URL = process.env.ADMIN_SERVICE_URL || "http://127.0.0.1:4010";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/admin/:path*",
        destination: `${ADMIN_URL}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
