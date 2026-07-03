import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ISessionValidator } from "../session-validator.interface";
export declare class AuthGuard implements CanActivate {
  private readonly sessionValidator;
  private readonly reflector;
  constructor(sessionValidator: ISessionValidator, reflector: Reflector);
  canActivate(context: ExecutionContext): Promise<boolean>;
  private extractBearerToken;
  private extractIp;
}
