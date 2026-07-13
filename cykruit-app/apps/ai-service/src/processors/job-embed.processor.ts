import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@cykruit/prisma';
import { EmbeddingProvider, AI_QUEUES, AI_JOB_NAMES, EmbedJobPayload } from '@cykruit/ai';

@Processor(AI_QUEUES.AI_JOBS)
export class JobEmbedProcessor {
  private readonly logger = new Logger(JobEmbedProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  @Process(AI_JOB_NAMES.EMBED_JOB)
  async handleEmbedJob(job: Job<EmbedJobPayload>) {
    const { jobId } = job.data;
    this.logger.log(`Processing embed job for jobId: ${jobId}`);

    try {
      const jobData = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!jobData) {
        this.logger.warn(`Job ${jobId} not found`);
        return;
      }

      // Concatenate fields for embedding
      const textToEmbed = `
        Title: ${jobData.jobTitle}
        Type: ${jobData.jobType}
        Level: ${jobData.experienceLevel}
        Description: ${jobData.description}
      `.trim();

      const vector = await this.embeddingProvider.embedQuery(textToEmbed);

      // Serialize vector array for pgvector
      const vectorString = `[${vector.join(',')}]`;

      await this.prisma.$executeRaw`
        UPDATE "jobs"
        SET "embedding" = ${vectorString}::vector,
            "embeddedAt" = NOW()
        WHERE "id" = ${jobId}
      `;

      this.logger.log(`Successfully embedded job ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to embed job ${jobId}`, error);
      throw error;
    }
  }
}
