import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const ADMIN_URL = process.env.ADMIN_SERVICE_URL || "http://127.0.0.1:4010";
// Local upload driver stores files under seeker-profile-service's own
// uploads/ folder and only that service serves them statically — mirrors
// the identical rewrite in cykruit-ui/next.config.ts.
const PROFILE_URL = process.env.PROFILE_SERVICE_URL || "http://127.0.0.1:4003";

// See cykruit-ui/next.config.ts for why this is conditional: the Docker build
// context is scoped to admin-ui/ alone, so the parent dir isn't the real monorepo root there.
const monorepoRoot = path.resolve(__dirname, "..");
const hasMonorepoRoot = fs.existsSync(path.join(monorepoRoot, "package-lock.json"));

const nextConfig: NextConfig = {
  turbopack: {
    root: hasMonorepoRoot ? monorepoRoot : __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/admin/:path*",
        destination: `${ADMIN_URL}/admin/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${PROFILE_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
