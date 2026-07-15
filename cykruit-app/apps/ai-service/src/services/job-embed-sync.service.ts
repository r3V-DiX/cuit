import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@cykruit/prisma';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AI_QUEUES, AI_JOB_NAMES, EmbedJobPayload } from '@cykruit/ai';
import { JobStatus } from '@prisma/client';

@Injectable()
export class JobEmbedSyncService {
  private readonly logger = new Logger(JobEmbedSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(AI_QUEUES.AI_JOBS) private readonly aiQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncMissingEmbeddings() {
    this.logger.debug('Checking for approved jobs with missing embeddings...');

    try {
      // Find jobs that are approved but have no embedding
      const jobs = await this.prisma.job.findMany({
        where: {
          status: JobStatus.APPROVED,
          embeddedAt: null,
        },
        select: { id: true },
        take: 50, // Process in batches
      });

      if (jobs.length > 0) {
        this.logger.log(`Found ${jobs.length} approved jobs missing embeddings. Queuing...`);

        for (const job of jobs) {
          const payload: EmbedJobPayload = { jobId: job.id };
          await this.aiQueue.add(AI_JOB_NAMES.EMBED_JOB, payload, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to sync missing job embeddings', error);
    }
  }
}
