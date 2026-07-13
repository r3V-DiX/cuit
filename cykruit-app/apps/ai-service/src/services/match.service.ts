import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async matchSeekerToJob(seekerId: string, jobId: string) {
    try {
      // 1. Check if both have embeddings via a raw query since Prisma Unsupported ignores it in standard selects
      const [jobData, seekerData] = await Promise.all([
        this.prisma.$queryRaw`SELECT id FROM jobs WHERE id = ${jobId} AND embedding IS NOT NULL`,
        this.prisma.$queryRaw`SELECT id FROM resume_embeddings WHERE "seekerId" = ${seekerId} AND embedding IS NOT NULL`
      ]) as [any[], any[]];

      if (!jobData || jobData.length === 0) {
        throw new BadRequestException("Job does not have an embedding yet");
      }
      if (!seekerData || seekerData.length === 0) {
        throw new BadRequestException("Seeker does not have a resume embedding yet");
      }

      // 2. Compute cosine distance
      // distance = embedding <=> embedding
      // similarity = 1 - distance
      const result = await this.prisma.$queryRaw`
        SELECT 
          (1 - (r.embedding <=> j.embedding)) * 100 as score
        FROM resume_embeddings r, jobs j
        WHERE r."seekerId" = ${seekerId} AND j.id = ${jobId}
      ` as { score: number }[];

      if (!result || result.length === 0 || result[0].score === null) {
        throw new BadRequestException("Failed to calculate match score");
      }

      const score = Math.max(0, Math.min(100, Math.round(result[0].score)));

      // 3. Cache the score in SeekerJobMatch table
      const match = await this.prisma.seekerJobMatch.upsert({
        where: {
          seekerId_jobId: {
            seekerId,
            jobId
          }
        },
        update: {
          score,
          computedAt: new Date(),
        },
        create: {
          seekerId,
          jobId,
          score,
          computedAt: new Date(),
        }
      });

      return { score, matchId: match.id };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error matching seeker ${seekerId} to job ${jobId}`, error);
      throw new BadRequestException("An error occurred during match calculation");
    }
  }
}
