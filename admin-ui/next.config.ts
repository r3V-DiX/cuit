import type { NextConfig } from "next";
import path from "path";

const ADMIN_URL = process.env.ADMIN_SERVICE_URL || "http://127.0.0.1:4010";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
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
