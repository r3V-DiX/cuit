// libs/common/utils/response-builder.util.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RequestContextService } from "@cykruit/context";
import {
  ISuccessResponse,
  IErrorResponse,
  IWarningResponse,
  IInfoResponse,
  IResponseMeta,
  IPaginatedData,
  IPaginationMeta,
} from "../types/response.types";

@Injectable()
export class ResponseBuilder {
  private readonly includeMeta: boolean;
  private readonly includeRequestId: boolean;
  private readonly includeTimestamp: boolean;
  private readonly includePath: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly contextService: RequestContextService,
  ) {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    const includeMetaInProd =
      this.configService.get<string>("INCLUDE_META_IN_PRODUCTION", "false") ===
      "true";

    this.includeMeta = nodeEnv !== "production" || includeMetaInProd;
    this.includeRequestId =
      this.configService.get<string>("INCLUDE_REQUEST_ID", "true") === "true";
    this.includeTimestamp =
      this.configService.get<string>("INCLUDE_TIMESTAMP", "true") === "true";
    this.includePath =
      this.configService.get<string>(
        "INCLUDE_PATH",
        nodeEnv !== "production" ? "true" : "false",
      ) === "true";
  }

  private buildMeta(path?: string): IResponseMeta | undefined {
    if (!this.includeMeta) return undefined;

    const context = this.contextService.getContext();
    const meta: Partial<IResponseMeta> = {};

    if (this.includeTimestamp) meta.timestamp = new Date().toISOString();
    if (this.includeRequestId && context?.requestId)
      meta.requestId = context.requestId;
    if (this.includePath && path) meta.path = path;

    return Object.keys(meta).length === 0 ? undefined : (meta as IResponseMeta);
  }

  success<T>(
    data: T,
    message?: string,
    path?: string,
  ): Omit<ISuccessResponse<T>, "success"> {
    const response: any = { success: true, data };
    if (message) response.message = message;
    const meta = this.buildMeta(path);
    if (meta) response.meta = meta;
    return response;
  }

  paginated<T>(
    items: T[],
    pagination: IPaginationMeta,
    message?: string,
    path?: string,
  ): Omit<ISuccessResponse<IPaginatedData<T>>, "success"> {
    return this.success({ items, pagination }, message, path);
  }

  warning<T>(
    data: T,
    warningCode: string,
    warningMessage: string,
    path?: string,
  ): Omit<IWarningResponse<T>, "success"> {
    const response: any = {
      success: true,
      data,
      warning: { code: warningCode, message: warningMessage },
    };
    const meta = this.buildMeta(path);
    if (meta) response.meta = meta;
    return response;
  }

  info<T>(
    data: T,
    infoCode: string,
    infoMessage: string,
    path?: string,
  ): Omit<IInfoResponse<T>, "success"> {
    const response: any = {
      success: true,
      data,
      info: { code: infoCode, message: infoMessage },
    };
    const meta = this.buildMeta(path);
    if (meta) response.meta = meta;
    return response;
  }

  error(
    code: string,
    message: string,
    statusCode: number,
    path?: string,
    details?: unknown,
  ): Omit<IErrorResponse, "success"> {
    const response: any = {
      success: false,
      error: { code, message, statusCode, ...(details && { details }) },
    };
    const meta = this.buildMeta(path);
    if (meta) response.meta = meta;
    return response;
  }

  buildPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): IPaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  shouldIncludeMeta(): boolean {
    return this.includeMeta;
  }
}
