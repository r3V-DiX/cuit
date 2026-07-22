import {
  Injectable,
  Inject,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { Reflector } from "@nestjs/core";
import { ThrottlerStorage } from "@nestjs/throttler";

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly trustedProxyCount: number;

  constructor(
    @Inject('THROTTLER:MODULE_OPTIONS') options: any,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    @Inject(Reflector) reflector: Reflector,
  ) {
    super(options, storageService, reflector);
    const raw = process.env.TRUSTED_PROXY_COUNT ?? "0";
    const parsed = parseInt(raw, 10);
    this.trustedProxyCount = isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  // ✅ Override shouldSkip — reads SkipThrottle metadata correctly for named throttlers
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const skipMetadata = this.reflector.getAllAndOverride<
      Record<string, boolean> | boolean
    >("THROTTLER:SKIP", [context.getHandler(), context.getClass()]);

    if (skipMetadata === true) return true;
    if (
      typeof skipMetadata === "object" &&
      Object.values(skipMetadata).some((v) => v === true)
    )
      return true;

    return false;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.id) {
      return `u:${req.user.id}`;
    }
    const ip = this.extractRealIp(req);
    return `ip:${ip}`;
  }

  private extractRealIp(req: Record<string, any>): string {
    const forwarded = req.headers?.["x-forwarded-for"];
    if (forwarded && typeof forwarded === "string") {
      const ips = forwarded
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      if (ips.length > 0 && this.isValidIpFormat(ips[0])) {
        return this.normalizeIp(ips[0]);
      }
    }

    const socketIp: string = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    return this.normalizeIp(socketIp);
  }

  private normalizeIp(ip: string): string {
    if (!ip) return "unknown";
    if (ip.startsWith("::ffff:")) return ip.slice(7);
    return ip;
  }

  private isValidIpFormat(ip: string): boolean {
    if (!ip) return false;
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^[0-9a-fA-F:]+$/;
    return ipv4.test(ip) || ipv6.test(ip);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (err) {
      if (err instanceof ThrottlerException) {
        const res = context.switchToHttp().getResponse();
        const retryAfter = Number(res.getHeader?.("Retry-After") ?? 60);

        throw new HttpException(
          {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please wait before trying again.",
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw err;
    }
  }
}
