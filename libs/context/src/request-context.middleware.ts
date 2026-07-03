// libs/context/request-context.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { RequestContextService } from "./request-context.service";
import { IRequestContext } from "./request-context.interface";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers["x-request-id"] as string) || uuidv4();

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";

    const context: IRequestContext = {
      requestId,
      ip,
      userAgent,
      path: req.url,
      method: req.method,
      timestamp: new Date(),
    };

    res.setHeader("X-Request-Id", requestId);
    this.contextService.setContext(context);
    next();
  }
}
