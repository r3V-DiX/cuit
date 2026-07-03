import { LoggerService } from "@nestjs/common";
import { RequestContextService } from "@cykruit/context";
export declare class AppLogger implements LoggerService {
  private readonly contextService;
  private logLevels;
  private readonly colors;
  constructor(contextService: RequestContextService);
  private mapLogLevel;
  private colorize;
  private formatTimestamp;
  private getContextInfo;
  private formatMessage;
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
  logRequest(
    method: string,
    url: string,
    statusCode?: number,
    responseTime?: number,
  ): void;
}
