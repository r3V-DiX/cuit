import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@cykruit/prisma';
import { EmbeddingProvider, AI_QUEUES, AI_JOB_NAMES, EmbedResumePayload } from '@cykruit/ai';

@Processor(AI_QUEUES.AI_JOBS)
export class ResumeEmbedProcessor {
  private readonly logger = new Logger(ResumeEmbedProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  @Process(AI_JOB_NAMES.EMBED_RESUME)
  async handleEmbedResume(job: Job<EmbedResumePayload>) {
    const { seekerId } = job.data;
    this.logger.log(`Processing embed resume for seekerId: ${seekerId}`);

    try {
      const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
        where: { userId: seekerId },
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          education: true,
        }
      });

      if (!seekerProfile) {
        this.logger.warn(`Seeker ${seekerId} not found`);
        return;
      }

      // Concatenate fields for embedding
      const summary = seekerProfile.professionalSummary || '';
      const title = seekerProfile.title || '';
      const skillsStr = seekerProfile.skills.map(s => s.skill.name).join(', ');
      const expStr = seekerProfile.experiences.map(e => `${e.title} at ${e.company} - ${e.description || ''}`).join(' | ');
      const eduStr = seekerProfile.education.map(e => `${e.degree} from ${e.instituteName}`).join(' | ');

      const parts = [];
      if (title) parts.push(`Title: ${title}`);
      if (summary) parts.push(`Summary: ${summary}`);
      if (skillsStr) parts.push(`Skills: ${skillsStr}`);
      if (expStr) parts.push(`Experience: ${expStr}`);
      if (eduStr) parts.push(`Education: ${eduStr}`);

      const textToEmbed = parts.join('\n\n');

      if (!textToEmbed.trim()) {
        this.logger.warn(`No content to embed for seekerId: ${seekerId}`);
        return;
      }

      const vector = await this.embeddingProvider.embedQuery(textToEmbed.trim());
      const vectorString = `[${vector.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO "resume_embeddings" ("id", "seekerId", "embedding", "updatedAt")
        VALUES (gen_random_uuid(), ${seekerProfile.id}, ${vectorString}::vector, NOW())
        ON CONFLICT ("seekerId")
        DO UPDATE SET "embedding" = EXCLUDED."embedding", "updatedAt" = NOW()
      `;

      // Clear cached match scores so they are re-calculated with the new embedding
      await this.prisma.seekerJobMatch.deleteMany({
        where: { seekerId: seekerProfile.id }
      });

      this.logger.log(`Successfully embedded resume and cleared match cache for seekerId: ${seekerId}`);
    } catch (error) {
      this.logger.error(`Failed to embed resume for seekerId: ${seekerId}`, error);
      throw error;
    }
  }
}
