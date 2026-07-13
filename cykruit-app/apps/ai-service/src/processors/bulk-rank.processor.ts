import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from '@cykruit/prisma';
import { AI_QUEUES, AI_JOB_NAMES, BulkRankJobPayload, ScoreApplicationPayload } from '@cykruit/ai';

@Processor(AI_QUEUES.AI_JOBS)
export class BulkRankProcessor {
  private readonly logger = new Logger(BulkRankProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(AI_QUEUES.AI_JOBS) private aiQueue: Queue,
  ) {}

  @Process(AI_JOB_NAMES.BULK_RANK_JOB)
  async handleBulkRankJob(job: Job<BulkRankJobPayload>) {
    const { jobId } = job.data;
    this.logger.log(`Processing bulk rank for jobId: ${jobId}`);

    try {
      const applications = await this.prisma.application.findMany({
        where: {
          jobId,
          aiScore: null, // Only score unscored ones
        },
        select: { id: true, seekerId: true },
      });

      this.logger.log(`Found ${applications.length} unscored applications for job ${jobId}`);

      for (const app of applications) {
        await this.aiQueue.add(AI_JOB_NAMES.SCORE_APPLICATION, {
          applicationId: app.id,
          seekerId: app.seekerId,
          jobId,
        } as ScoreApplicationPayload);
      }

      this.logger.log(`Successfully queued ${applications.length} score jobs for ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to bulk rank job ${jobId}`, error);
      throw error;
    }
  }
}
