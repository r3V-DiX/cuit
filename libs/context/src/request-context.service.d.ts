import { IRequestContext } from "./request-context.interface";
export declare class RequestContextService {
  private readonly asyncLocalStorage;
  setContext(context: IRequestContext): void;
  getContext(): IRequestContext | undefined;
  getRequestId(): string | undefined;
  getUserId(): string | undefined;
  getUserEmail(): string | undefined;
  getIp(): string | undefined;
  run<T>(context: IRequestContext, callback: () => T): T;
}
