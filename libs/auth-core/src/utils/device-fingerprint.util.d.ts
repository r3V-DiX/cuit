import type { Request } from "express";
export interface DeviceFingerprint {
  hash: string;
  components: {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    secChUa: string;
    secChUaPlatform: string;
  };
}
export declare function generateDeviceFingerprint(
  req: Request,
): DeviceFingerprint;
export declare function compareFingerprints(
  stored: string,
  current: string,
): {
  match: boolean;
  confidence: "high" | "medium" | "low";
};
