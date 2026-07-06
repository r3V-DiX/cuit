// libs/config/session.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("session", () => ({
  expiresIn: process.env.SESSION_EXPIRES_IN || "24h",
  rememberMeExpiresIn: process.env.SESSION_REMEMBER_ME_EXPIRES_IN || "30d",
  rotationIntervalMinutes: parseInt(
    process.env.SESSION_ROTATION_INTERVAL_MINUTES || "15",
    10,
  ),
  trustedSsrUserAgents: (
    process.env.TRUSTED_SSR_USER_AGENTS || "NextJS-SSR/1.0"
  ).split(","),
}));
