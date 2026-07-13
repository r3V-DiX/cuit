import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@cykruit/prisma';
import { QueueModule } from '@cykruit/queue';
import { AIModule, AI_QUEUES } from '@cykruit/ai';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';
import { JobEmbedProcessor } from './processors/job-embed.processor';
import { ApplicationScoreProcessor } from './processors/application-score.processor';
import { BulkRankProcessor } from './processors/bulk-rank.processor';
import { ScoringService } from './services/scoring.service';
import { ResumeParserService } from './services/resume-parser.service';
import { JobAssistantService } from './services/job-assistant.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AIModule,
    QueueModule.forRoot({ queues: [AI_QUEUES.AI_JOBS] }),
  ],
  controllers: [AiServiceController],
  providers: [
    AiServiceService,
    JobEmbedProcessor,
    ApplicationScoreProcessor,
    BulkRankProcessor,
    ScoringService,
    ResumeParserService,
    JobAssistantService,
  ],
})
export class AiServiceModule {}
