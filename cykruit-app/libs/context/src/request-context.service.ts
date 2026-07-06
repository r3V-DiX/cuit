// libs/context/request-context.service.ts
import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { IRequestContext } from "./request-context.interface";

@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<IRequestContext>();

  setContext(context: IRequestContext): void {
    this.asyncLocalStorage.enterWith(context);
  }

  getContext(): IRequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }

  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  getUserEmail(): string | undefined {
    return this.getContext()?.email;
  }

  getIp(): string | undefined {
    return this.getContext()?.ip;
  }

  run<T>(context: IRequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }
}
