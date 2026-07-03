import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ISessionValidator } from "../session-validator.interface";
export declare class OptionalAuthGuard implements CanActivate {
  private readonly sessionValidator;
  constructor(sessionValidator: ISessionValidator);
  canActivate(context: ExecutionContext): Promise<boolean>;
}
