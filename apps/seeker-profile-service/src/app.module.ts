// apps/seeker-profile-service/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";

import { PrismaModule } from "@cykruit/prisma";
import { LoggerModule } from "@cykruit/logger";
import {
  RequestContextModule,
  RequestContextMiddleware,
} from "@cykruit/context";
import { CommonModule } from "@cykruit/common";
import { UploadModule } from "@cykruit/upload";
import { RateLimitModule } from "@cykruit/rate-limit";
import { LoggerMiddleware } from "@cykruit/logger";

import { SeekerProfileModule } from "./profile/profile.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === "production" ? ".env.production" : ".env",
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "single",
        url: `redis://${config.get("REDIS_HOST", "localhost")}:${config.get("REDIS_PORT", 6379)}`,
        options: {
          password: config.get("REDIS_PASSWORD") || undefined,
          db: config.get<number>("REDIS_DB", 0),
        },
      }),
    }),

    RequestContextModule,
    LoggerModule,
    PrismaModule,
    CommonModule,
    UploadModule,
    RateLimitModule,

    SeekerProfileModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
