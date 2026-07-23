// libs/common/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseBuilder } from "../utils/response-builder.util";
import {
  ServiceResponseWithMessage,
  ServiceResponseWithWarning,
  ServiceResponseWithInfo,
} from "../types/response.types";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly responseBuilder: ResponseBuilder) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) return data;

        if (data === null || data === undefined)
          return this.responseBuilder.success(null, undefined, request.url);

        if (typeof data === "object" && "success" in data) return data;

        if (this.isMessageOnly(data))
          return this.responseBuilder.success(null, data.message, request.url);

        if (this.isWarningOnly(data))
          return this.responseBuilder.warning(
            null,
            data.warning.code,
            data.warning.message,
            request.url,
          );

        if (this.isWarningResponse(data))
          return this.responseBuilder.warning(
            data.data,
            data.warning.code,
            data.warning.message,
            request.url,
          );

        if (this.isInfoResponse(data))
          return this.responseBuilder.info(
            data.data,
            data.info.code,
            data.info.message,
            request.url,
          );

        if (this.isRawObjectWithInfo(data)) {
          const { info, ...rest } = data;
          return this.responseBuilder.info(
            rest,
            info.code,
            info.message,
            request.url,
          );
        }

        if (this.isMessageResponse(data))
          return this.responseBuilder.success(
            data.data,
            data.message,
            request.url,
          );

        return this.responseBuilder.success(data, undefined, request.url);
      }),
    );
  }

  private isMessageOnly(data: any): boolean {
    return (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string" &&
      !("data" in data) &&
      !("warning" in data) &&
      !("info" in data)
    );
  }

  private isWarningOnly(data: any): boolean {
    return (
      typeof data === "object" &&
      data !== null &&
      "warning" in data &&
      typeof data.warning === "object" &&
      "code" in data.warning &&
      "message" in data.warning &&
      !("data" in data)
    );
  }

  private isWarningResponse(
    data: any,
  ): data is ServiceResponseWithWarning<any> {
    return (
      typeof data === "object" &&
      data !== null &&
      "data" in data &&
      "warning" in data &&
      typeof data.warning === "object" &&
      "code" in data.warning &&
      "message" in data.warning
    );
  }

  private isInfoResponse(data: any): data is ServiceResponseWithInfo<any> {
    return (
      typeof data === "object" &&
      data !== null &&
      "data" in data &&
      "info" in data &&
      typeof data.info === "object" &&
      "code" in data.info &&
      "message" in data.info
    );
  }

  private isRawObjectWithInfo(data: any): boolean {
    return (
      typeof data === "object" &&
      data !== null &&
      "info" in data &&
      typeof data.info === "object" &&
      "code" in data.info &&
      "message" in data.info &&
      !("data" in data) &&
      !("warning" in data)
    );
  }

  private isMessageResponse(
    data: any,
  ): data is ServiceResponseWithMessage<any> {
    return (
      typeof data === "object" &&
      data !== null &&
      "data" in data &&
      "message" in data &&
      typeof data.message === "string" &&
      !("warning" in data) &&
      !("info" in data)
    );
  }
}
