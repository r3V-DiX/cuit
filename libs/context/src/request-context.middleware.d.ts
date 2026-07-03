import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RequestContextService } from "./request-context.service";
export declare class RequestContextMiddleware implements NestMiddleware {
  private readonly contextService;
  constructor(contextService: RequestContextService);
  use(req: Request, res: Response, next: NextFunction): void;
}
