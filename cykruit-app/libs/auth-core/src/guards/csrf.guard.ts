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
  /** Cookie whose value must equal the `x-csrf-token` header (true double-submit). */
  private readonly cookieName: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    const csrfSecret = this.configService.get<string>("CSRF_SECRET");
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    const keyMaterial = csrfSecret || jwtSecret;
    if (!keyMaterial)
      throw new Error("CSRF_SECRET (or JWT_SECRET) must be set for CSRF protection");
    this.secret = createHmac("sha256", keyMaterial)
      .update("csrf-token-v1")
      .digest("hex");
    // Main services issue `csrf_token` (CookieConfig.COOKIE_NAMES.CSRF); the
    // admin console issues `admin_csrf_token`. Overridable per deployment.
    this.cookieName =
      this.configService.get<string>("CSRF_COOKIE_NAME") || "csrf_token";
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
      // Generic message — do not expose internal CSRF mechanism to the client.
      throw new ForbiddenException("Invalid request. Please try again.");
    }

    if (!this.verifyToken(token)) {
      // Generic message — do not expose internal CSRF mechanism to the client.
      throw new ForbiddenException("Invalid request. Please try again.");
    }

    // True double-submit: the header token must also match the csrf cookie the
    // server issued for this browser. This binds the token to the client that
    // received the cookie — a token forged from the secret, or one minted for a
    // different session/browser, no longer passes even though its signature is
    // valid. Both frontends read the cookie fresh per request, so this holds.
    const cookieToken = (request.cookies ?? {})[this.cookieName] as
      | string
      | undefined;
    if (!cookieToken || cookieToken !== token) {
      // Generic message — do not expose internal CSRF mechanism to the client.
      throw new ForbiddenException("Invalid request. Please try again.");
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
