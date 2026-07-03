// libs/logger/logger.module.ts
import { Global, Module } from "@nestjs/common";
import { AppLogger } from "./logger.service";
import { LoggerInterceptor } from "./logger.interceptor";
import { LoggerMiddleware } from "./logger.middleware";
import { RequestContextModule } from "@cykruit/context";

@Global()
@Module({
  imports: [RequestContextModule],
  providers: [AppLogger, LoggerInterceptor, LoggerMiddleware],
  exports: [AppLogger, LoggerInterceptor, LoggerMiddleware],
})
export class LoggerModule {}
