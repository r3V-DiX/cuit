import {
  ExceptionFilter,
  ArgumentsHost,
  BadRequestException,
} from "@nestjs/common";
import { AppLogger } from "@cykruit/logger";
import { RequestContextService } from "@cykruit/context";
import { ResponseBuilder } from "../utils/response-builder.util";
export declare class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger;
  private readonly contextService;
  private readonly responseBuilder;
  constructor(
    logger: AppLogger,
    contextService: RequestContextService,
    responseBuilder: ResponseBuilder,
  );
  catch(exception: BadRequestException, host: ArgumentsHost): void;
  private parseErrors;
  private extractField;
}
