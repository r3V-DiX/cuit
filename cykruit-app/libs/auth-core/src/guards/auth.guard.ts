// libs/auth-core/src/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Optional,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import {
  SESSION_VALIDATOR,
  ISessionValidator,
} from "../session-validator.interface";
import { CookieConfig } from "@cykruit/config";
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from "../decorators";
import { CsrfGuard } from "./csrf.guard";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SESSION_VALIDATOR)
    private readonly sessionValidator: ISessionValidator,
    private readonly reflector: Reflector,
    @Optional() private readonly csrfGuard?: CsrfGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isOptional) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Cookie first, Bearer token as fallback (for Postman / mobile / API clients)
    const sessionToken =
      request.cookies[CookieConfig.COOKIE_NAMES.SESSION] ||
      this.extractBearerToken(request);

    if (!sessionToken) {
      throw new UnauthorizedException("No session token found. Please login.");
    }

    try {
      const ipAddress = this.extractIp(request);
      const userAgent =
        request.headers["user-agent"]?.substring(0, 255) || "unknown";

      const { user, newToken, rememberMe, expiresAt } = await this.sessionValidator.validateSession(
        sessionToken,
        ipAddress,
        userAgent,
        request, // ✅ now passed — fingerprint comparison runs in both validators
      );

      // Transparent session rotation — preserve rememberMe so cookie maxAge stays correct
      if (newToken) {
        response.cookie(
          CookieConfig.COOKIE_NAMES.SESSION,
          newToken,
          CookieConfig.getSessionCookieOptions(rememberMe ?? false),
        );
        request.cookies[CookieConfig.COOKIE_NAMES.SESSION] = newToken;
      }

      // Sliding-window CSRF refresh — the signed token's own HMAC expiry stays
      // short, but renewing the cookie on every authenticated request means it
      // never goes stale for an active session (whose cookie can outlive it).
      if (this.csrfGuard) {
        response.cookie(
          CookieConfig.COOKIE_NAMES.CSRF,
          this.csrfGuard.generateToken(),
          CookieConfig.getCsrfCookieOptions(),
        );
      }

      request["user"] = user;
      request["sessionExpiresAt"] = expiresAt;
      return true;
    } catch (error) {
      response.clearCookie(
        CookieConfig.COOKIE_NAMES.SESSION,
        CookieConfig.getClearCookieOptions(),
      );
      throw new UnauthorizedException(
        error.message || "Invalid or expired session. Please login again.",
      );
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    return authHeader.substring(7);
  }

  private extractIp(request: Request): string {
    const trustedProxyCount = parseInt(process.env.TRUSTED_PROXY_COUNT ?? "0", 10);
    const socketIp = request.ip || request.socket?.remoteAddress || "unknown";
    if (trustedProxyCount === 0) return socketIp;
    const forwarded = request.headers["x-forwarded-for"] as string;
    if (!forwarded) return socketIp;
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length === 0) return socketIp;
    return ips[Math.max(0, ips.length - trustedProxyCount - 1)] || socketIp;
  }
}
