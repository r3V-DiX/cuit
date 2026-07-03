import { ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Reflector } from "@nestjs/core";
import { ThrottlerStorage } from "@nestjs/throttler";
export declare class RateLimitGuard extends ThrottlerGuard {
  private readonly trustedProxyCount;
  constructor(
    options: any,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  );
  protected shouldSkip(context: ExecutionContext): Promise<boolean>;
  protected getTracker(req: Record<string, any>): Promise<string>;
  private extractRealIp;
  private normalizeIp;
  private isValidIpFormat;
  canActivate(context: ExecutionContext): Promise<boolean>;
}
