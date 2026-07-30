import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@cykruit/prisma';
import { QueueModule } from '@cykruit/queue';
import { AIModule, AI_QUEUES } from '@cykruit/ai';
import { AuthCoreModule, AuthGuard, SharedSessionValidator } from '@cykruit/auth-core';
import { SubscriptionModule } from '@cykruit/subscription';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';
import { JobEmbedProcessor } from './processors/job-embed.processor';
import { ResumeEmbedProcessor } from './processors/resume-embed.processor';
import { ApplicationScoreProcessor } from './processors/application-score.processor';
import { BulkRankProcessor } from './processors/bulk-rank.processor';
import { ScoringService } from './services/scoring.service';
import { ResumeParserService } from './services/resume-parser.service';
import { JobAssistantService } from './services/job-assistant.service';
import { SeekerAssistantService } from './services/seeker-assistant.service';
import { MatchService } from './services/match.service';
import { JobEmbedSyncService } from './services/job-embed-sync.service';
import { AiScoringGuard } from './guards/ai-scoring.guard';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AIModule,
    QueueModule.forRoot({ queues: [AI_QUEUES.AI_JOBS] }),
    ScheduleModule.forRoot(),
    AuthCoreModule.forRoot({
      sessionValidatorClass: SharedSessionValidator,
      imports: [PrismaModule, ConfigModule],
    }),
    SubscriptionModule,
  ],
  controllers: [AiServiceController],
  providers: [
    // Global auth guard — all routes require a valid session by default.
    // Use @Public() on any route that should be unauthenticated.
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AiServiceService,
    JobEmbedProcessor,
    ResumeEmbedProcessor,
    ApplicationScoreProcessor,
    BulkRankProcessor,
    ScoringService,
    ResumeParserService,
    JobAssistantService,
    SeekerAssistantService,
    MatchService,
    JobEmbedSyncService,
    AiScoringGuard,
  ],
})
export class AiServiceModule {}
