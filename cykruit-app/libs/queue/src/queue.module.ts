// libs/queue/queue.module.ts
import { Module, Global, DynamicModule } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QueueService } from "../services/queue.service";
import { BullQueueService } from "../services/bull-queue.service";
import { LoggerModule } from "@cykruit/logger";

export interface QueueModuleOptions {
  queues: string[];
}

@Global()
@Module({})
export class QueueModule {
  static forRoot(options: QueueModuleOptions): DynamicModule {
    const bullQueues = options.queues.map((name) =>
      BullModule.registerQueue({
        name,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    );

    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        LoggerModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (config: ConfigService) => ({
            redis: {
              host: config.get("REDIS_HOST", "localhost"),
              port: config.get("REDIS_PORT", 6379),
              password: config.get("REDIS_PASSWORD"),
              db: config.get("REDIS_DB", 0),
            },
          }),
          inject: [ConfigService],
        }),
        ...bullQueues,
      ],
      providers: [{ provide: QueueService, useClass: BullQueueService }],
      exports: [QueueService, BullModule],
    };
  }
}
