import { ConfigService } from "@nestjs/config";
import { RequestContextService } from "@cykruit/context";
import {
  ISuccessResponse,
  IErrorResponse,
  IWarningResponse,
  IInfoResponse,
  IPaginatedData,
  IPaginationMeta,
} from "../types/response.types";
export declare class ResponseBuilder {
  private readonly configService;
  private readonly contextService;
  private readonly includeMeta;
  private readonly includeRequestId;
  private readonly includeTimestamp;
  private readonly includePath;
  constructor(
    configService: ConfigService,
    contextService: RequestContextService,
  );
  private buildMeta;
  success<T>(
    data: T,
    message?: string,
    path?: string,
  ): Omit<ISuccessResponse<T>, "success">;
  paginated<T>(
    items: T[],
    pagination: IPaginationMeta,
    message?: string,
    path?: string,
  ): Omit<ISuccessResponse<IPaginatedData<T>>, "success">;
  warning<T>(
    data: T,
    warningCode: string,
    warningMessage: string,
    path?: string,
  ): Omit<IWarningResponse<T>, "success">;
  info<T>(
    data: T,
    infoCode: string,
    infoMessage: string,
    path?: string,
  ): Omit<IInfoResponse<T>, "success">;
  error(
    code: string,
    message: string,
    statusCode: number,
    path?: string,
    details?: any,
  ): Omit<IErrorResponse, "success">;
  buildPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): IPaginationMeta;
  shouldIncludeMeta(): boolean;
}
