import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingProvider } from '@cykruit/ai';
import { PrismaService } from '@cykruit/prisma';

@Injectable()
export class AiServiceService {
  private readonly logger = new Logger(AiServiceService.name);

  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly prisma: PrismaService,
  ) {}

  async getEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.embedQuery(text);
  }

  async matchSeekerToJob(seekerId: string, jobId: string): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<{ score: number }[]>`
        SELECT 
          (1 - (re.embedding <=> j.embedding)) * 100 AS score
        FROM resume_embeddings re
        CROSS JOIN jobs j
        WHERE re."seekerId" = ${seekerId} AND j.id = ${jobId}
      `;

      if (result.length === 0 || result[0].score == null) {
        return 0; // Or handle as null
      }

      const matchScore = Math.round(result[0].score);

      // Cache the result
      await this.prisma.$executeRaw`
        INSERT INTO seeker_job_matches ("id", "seekerId", "jobId", "score", "computedAt")
        VALUES (gen_random_uuid(), ${seekerId}, ${jobId}, ${matchScore}, NOW())
        ON CONFLICT ("seekerId", "jobId") 
        DO UPDATE SET "score" = ${matchScore}, "computedAt" = NOW()
      `;

      return matchScore;
    } catch (error) {
      this.logger.error('Failed to compute match score', error);
      throw error;
    }
  }
}
