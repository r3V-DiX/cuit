import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const ADMIN_URL = process.env.ADMIN_SERVICE_URL || "http://127.0.0.1:4010";

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
        // Local upload driver (dev default) writes under admin-app's own
        // process.cwd(); admin-app serves its own uploads/ folder statically
        // (see admin-app/src/main.ts) since it's a separate directory tree
        // from cykruit-app's services.
        source: "/uploads/:path*",
        destination: `${ADMIN_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
