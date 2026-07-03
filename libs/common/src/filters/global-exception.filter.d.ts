import { ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { AppLogger } from "@cykruit/logger";
import { RequestContextService } from "@cykruit/context";
import { ResponseBuilder } from "../utils/response-builder.util";
export declare class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger;
  private readonly contextService;
  private readonly responseBuilder;
  constructor(
    logger: AppLogger,
    contextService: RequestContextService,
    responseBuilder: ResponseBuilder,
  );
  catch(exception: unknown, host: ArgumentsHost): void;
  private statusToCode;
  private extractCodeFromMessage;
  private formatValidationErrors;
  private extractField;
  private extractConstraint;
  private isPrismaError;
  private handlePrismaError;
}
