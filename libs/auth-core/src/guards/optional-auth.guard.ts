// libs/auth-core/guards/optional-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";
import { Request } from "express";
import {
  SESSION_VALIDATOR,
  ISessionValidator,
} from "../session-validator.interface";
import { CookieConfig } from "@cykruit/config";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(SESSION_VALIDATOR)
    private readonly sessionValidator: ISessionValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionToken = request.cookies[CookieConfig.COOKIE_NAMES.SESSION];

    if (!sessionToken) {
      request["user"] = null;
      return true;
    }

    try {
      const { user } =
        await this.sessionValidator.validateSession(sessionToken);
      request["user"] = user || null;
    } catch {
      request["user"] = null;
    }

    return true;
  }
}
