// libs/config/app.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  appUrl: resolveUrl(process.env.APP_URL, "http://localhost:3000"),
  apiUrl: resolveUrl(process.env.API_URL, "http://localhost:4000"),
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],
  logLevel: process.env.LOG_LEVEL || "log",
}));

/** Fall back to `fallback` unless `value` is a real absolute http(s) URL, and
 *  strip any trailing slash — empty or bare "http://" env values must never
 *  produce broken "http:///..." links. */
function resolveUrl(value: string | undefined, fallback: string): string {
  const v = value || "";
  return /^https?:\/\/.+/.test(v) ? v.replace(/\/+$/, "") : fallback;
}
