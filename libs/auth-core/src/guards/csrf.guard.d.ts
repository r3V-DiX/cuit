import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
export declare class CsrfGuard implements CanActivate {
  private readonly reflector;
  private readonly configService;
  private readonly secret;
  constructor(reflector: Reflector, configService: ConfigService);
  canActivate(context: ExecutionContext): boolean;
  generateToken(): string;
  verifyToken(token: string): boolean;
}
