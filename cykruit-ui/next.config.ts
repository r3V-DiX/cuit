import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// turbopack.root must point at the real monorepo root (fixes Turbopack's
// multi-lockfile root-inference warning in local dev, where cykruit-new/package-lock.json
// sits alongside this app's own). In the Docker build, the build context is scoped to
// cykruit-ui/ alone, so the parent dir isn't the monorepo root — falling back to this
// app's own dir keeps output: "standalone" from nesting server.js under a wrong subpath.
const monorepoRoot = path.resolve(__dirname, "..");
const hasMonorepoRoot = fs.existsSync(path.join(monorepoRoot, "package-lock.json"));

const AUTH_URL      = process.env.AUTH_SERVICE_URL      || "http://127.0.0.1:4001";
const SETTINGS_URL  = process.env.SETTINGS_SERVICE_URL  || "http://127.0.0.1:4002";
const PROFILE_URL   = process.env.PROFILE_SERVICE_URL   || "http://127.0.0.1:4003";
const EMPLOYER_URL  = process.env.EMPLOYER_SERVICE_URL  || "http://127.0.0.1:4004";
const SEEKER_URL    = process.env.SEEKER_SERVICE_URL    || "http://127.0.0.1:4005";
const PUBLIC_URL    = process.env.PUBLIC_SERVICE_URL    || "http://127.0.0.1:4006";
const NOTIF_URL     = process.env.NOTIF_SERVICE_URL     || "http://127.0.0.1:4007";
const SUBS_URL      = process.env.SUBS_SERVICE_URL      || "http://127.0.0.1:4008";
const AI_URL        = process.env.AI_SERVICE_URL        || "http://127.0.0.1:3005";

// CSP is set per-request with a nonce in proxy.ts — not here as a static header.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  turbopack: {
    root: hasMonorepoRoot ? monorepoRoot : __dirname,
  },
  experimental: {
    proxyTimeout: 300000,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${AUTH_URL}/auth/:path*`,
      },
      {
        source: "/api/settings/:path*",
        destination: `${SETTINGS_URL}/settings/:path*`,
      },
      {
        source: "/api/profile/experiences/:path*",
        destination: `${PROFILE_URL}/experiences/:path*`,
      },
      {
        source: "/api/profile/education/:path*",
        destination: `${PROFILE_URL}/education/:path*`,
      },
      {
        source: "/api/profile/skills/:path*",
        destination: `${PROFILE_URL}/skills/:path*`,
      },
      {
        source: "/api/profile/certifications/:path*",
        destination: `${PROFILE_URL}/certifications/:path*`,
      },
      {
        source: "/api/profile/projects/:path*",
        destination: `${PROFILE_URL}/projects/:path*`,
      },
      {
        source: "/api/profile/ctf-profiles/:path*",
        destination: `${PROFILE_URL}/ctf-profiles/:path*`,
      },
      {
        source: "/api/profile/resumes/:path*",
        destination: `${PROFILE_URL}/resumes/:path*`,
      },
      {
        source: "/api/profile/:path*",
        destination: `${PROFILE_URL}/profile/:path*`,
      },
      {
        source: "/api/employer/:path*",
        destination: `${EMPLOYER_URL}/employer/:path*`,
      },
      {
        source: "/api/seeker/:path*",
        destination: `${SEEKER_URL}/seeker/:path*`,
      },
      {
        source: "/api/notifications/:path*",
        destination: `${NOTIF_URL}/notifications/:path*`,
      },
      {
        source: "/api/conversations/:path*",
        destination: `${NOTIF_URL}/conversations/:path*`,
      },
      {
        source: "/api/subscriptions/:path*",
        destination: `${SUBS_URL}/subscriptions/:path*`,
      },
      {
        source: "/api/public/:path*",
        destination: `${PUBLIC_URL}/public/:path*`,
      },
      {
        source: "/api/domains",
        destination: `${PUBLIC_URL}/domains`,
      },
      {
        source: "/api/roles",
        destination: `${PUBLIC_URL}/roles`,
      },
      // Internal ai-service routes (embed/query, resume/parse, match-score, jobs/recommend)
      // are intentionally excluded — backend services call ai-service directly via AI_SERVICE_URL.
      // Only browser-facing endpoints are proxied here.
      { source: "/api/ai/profile/generate-bio",        destination: `${AI_URL}/ai/profile/generate-bio` },
      { source: "/api/ai/profile/suggest-skills",      destination: `${AI_URL}/ai/profile/suggest-skills` },
      { source: "/api/ai/profile/tips",                destination: `${AI_URL}/ai/profile/tips` },
      { source: "/api/ai/job-description/generate",    destination: `${AI_URL}/ai/job-description/generate` },
      { source: "/api/ai/jobs/improve-description",    destination: `${AI_URL}/ai/jobs/improve-description` },
      { source: "/api/ai/jobs/infer-domain",           destination: `${AI_URL}/ai/jobs/infer-domain` },
      { source: "/api/ai/jobs/suggest-skills",         destination: `${AI_URL}/ai/jobs/suggest-skills` },
      { source: "/api/ai/jobs/generate-questions",     destination: `${AI_URL}/ai/jobs/generate-questions` },
      {
        source: "/uploads/:path*",
        destination: `${PROFILE_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
