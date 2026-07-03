// libs/auth-core/src/guards/csrf.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { IS_PUBLIC_KEY } from "../decorators";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_HEADER = "x-csrf-token";
const TOKEN_SEPARATOR = ".";

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly secret: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    if (!jwtSecret)
      throw new Error("JWT_SECRET must be set for CSRF protection");
    this.secret = createHmac("sha256", jwtSecret)
      .update("csrf-token-v1")
      .digest("hex");
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (SAFE_METHODS.has(request.method)) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const token = request.headers[CSRF_HEADER] as string;
    if (!token) {
      throw new ForbiddenException({
        code: "CSRF_TOKEN_MISSING",
        message: "CSRF token is required for this request.",
      });
    }

    if (!this.verifyToken(token)) {
      throw new ForbiddenException({
        code: "CSRF_TOKEN_INVALID",
        message: "CSRF token is invalid or has expired.",
      });
    }

    return true;
  }

  generateToken(): string {
    const nonce = randomBytes(32).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
    const sig = createHmac("sha256", this.secret).update(payload).digest("hex");
    return `${payload}${TOKEN_SEPARATOR}${sig}`;
  }

  verifyToken(token: string): boolean {
    if (!token || typeof token !== "string") return false;

    const parts = token.split(TOKEN_SEPARATOR);
    if (parts.length !== 3) return false;

    const [nonce, timestamp, sig] = parts;
    if (!nonce || !timestamp || !sig) return false;

    const issuedAt = parseInt(timestamp, 36);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - issuedAt > 24 * 60 * 60) return false;

    const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
    const expectedSig = createHmac("sha256", this.secret)
      .update(payload)
      .digest("hex");

    try {
      return timingSafeEqual(
        Buffer.from(sig, "hex"),
        Buffer.from(expectedSig, "hex"),
      );
    } catch {
      return false;
    }
  }
}
