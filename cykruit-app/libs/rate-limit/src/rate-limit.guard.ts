import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Explicit skip decorator always wins.
    const skipMetadata = this.reflector.getAllAndOverride<
      Record<string, boolean> | boolean
    >("THROTTLER:SKIP", [context.getHandler(), context.getClass()]);
    if (skipMetadata === true) return true;
    if (
      typeof skipMetadata === "object" &&
      Object.values(skipMetadata).some((v) => v === true)
    )
      return true;

    // Opt-in throttling: skip unless the handler/class has a @Throttle decorator
    // with at least one named (non-global) throttler. Checked by looking for any
    // THROTTLER:TTL<name> metadata key where name !== "global".
    const SENSITIVE_THROTTLERS = [
      "login", "register", "forgot_password", "resend_verification",
      "verify_email", "refresh_token", "oauth", "reset_password",
      "check_verification", "public_search", "request_otp", "verify_otp",
    ];
    const targets = [context.getHandler(), context.getClass()];
    const hasExplicitThrottle = SENSITIVE_THROTTLERS.some((name) =>
      targets.some((t) => Reflect.getMetadata("THROTTLER:TTL" + name, t) !== undefined),
    );
    if (!hasExplicitThrottle) return true;

    return false;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.id ?? req.admin?.id;
    if (userId) return `u:${userId}`;
    const socketIp: string = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    const ip = socketIp.startsWith("::ffff:") ? socketIp.slice(7) : socketIp;
    return `ip:${ip}`;
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
