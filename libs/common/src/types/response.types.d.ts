export interface IResponseMeta {
  timestamp: string;
  requestId: string;
  path: string;
}
export interface ISuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
  meta: IResponseMeta;
}
export interface IErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
  meta: IResponseMeta;
}
export interface IWarningResponse<T = any> {
  success: true;
  data: T;
  warning: {
    code: string;
    message: string;
  };
  meta: IResponseMeta;
}
export interface IInfoResponse<T = any> {
  success: true;
  data: T;
  info: {
    code: string;
    message: string;
  };
  meta: IResponseMeta;
}
export interface IValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}
export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
export interface IPaginatedData<T> {
  items: T[];
  pagination: IPaginationMeta;
}
export type ApiResponse<T = any> =
  | ISuccessResponse<T>
  | IErrorResponse
  | IWarningResponse<T>
  | IInfoResponse<T>;
export declare function isSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ISuccessResponse<T> | IWarningResponse<T> | IInfoResponse<T>;
export declare function isErrorResponse(
  response: ApiResponse,
): response is IErrorResponse;
export declare function hasWarning<T>(
  response: ApiResponse<T>,
): response is IWarningResponse<T>;
export declare function hasInfo<T>(
  response: ApiResponse<T>,
): response is IInfoResponse<T>;
export type ServiceResponse<T> = T;
export interface ServiceResponseWithMessage<T> {
  data: T;
  message?: string;
}
export interface ServiceResponseWithWarning<T> {
  data: T;
  warning: {
    code: string;
    message: string;
  };
}
export interface ServiceResponseWithInfo<T> {
  data: T;
  info: {
    code: string;
    message: string;
  };
}
