import type { NextConfig } from "next";

const AUTH_URL      = process.env.AUTH_SERVICE_URL      || "http://127.0.0.1:4001";
const SETTINGS_URL  = process.env.SETTINGS_SERVICE_URL  || "http://127.0.0.1:4002";
const PROFILE_URL   = process.env.PROFILE_SERVICE_URL   || "http://127.0.0.1:4003";
const EMPLOYER_URL  = process.env.EMPLOYER_SERVICE_URL  || "http://127.0.0.1:4004";
const PUBLIC_URL    = process.env.PUBLIC_SERVICE_URL    || "http://127.0.0.1:4006";
const SEEKER_URL    = process.env.SEEKER_SERVICE_URL    || "http://127.0.0.1:4005";
const NOTIF_URL     = process.env.NOTIF_SERVICE_URL     || "http://127.0.0.1:4007";
const SUBS_URL      = process.env.SUBS_SERVICE_URL      || "http://127.0.0.1:4008";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
