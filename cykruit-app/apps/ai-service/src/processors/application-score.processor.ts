import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@cykruit/prisma';
import { AI_QUEUES, AI_JOB_NAMES, ScoreApplicationPayload } from '@cykruit/ai';
import { ScoringService } from '../services/scoring.service';

@Processor(AI_QUEUES.AI_JOBS)
export class ApplicationScoreProcessor {
  private readonly logger = new Logger(ApplicationScoreProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
  ) {}

  @Process(AI_JOB_NAMES.SCORE_APPLICATION)
  async handleScoreApplication(job: Job<ScoreApplicationPayload>) {
    const { applicationId, seekerId, jobId } = job.data;
    this.logger.log(`Processing score application for appId: ${applicationId}`);

    try {
      // 1. Fetch Employer Subscription via Job
      const jobData = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: {
          employer: {
            include: {
              subscription: {
                include: { package: true }
              }
            }
          }
        }
      });

      if (!jobData) {
        this.logger.warn(`Job ${jobId} not found. Skipping scoring.`);
        return;
      }

      // 2. Check aiScoringEnabled
      const aiEnabled = jobData.employer?.subscription?.package?.aiScoringEnabled ?? false;
      if (!aiEnabled) {
        this.logger.log(`AI scoring is not enabled for employer ${jobData.employerId}`);
        return;
      }

      // 3. Fetch Resume Text
      // Assuming seeker has a professional summary.
      const seeker = await this.prisma.jobSeekerProfile.findUnique({
        where: { userId: seekerId },
      });

      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
      });

      let resumeText = seeker?.professionalSummary || '';
      if (application?.screeningAnswers) {
        resumeText += '\nScreening Answers: ' + JSON.stringify(application.screeningAnswers);
      }

      if (!resumeText) {
        this.logger.warn(`No resume text found for seeker ${seekerId}. Skipping.`);
        return;
      }

      // 4. Generate Score
      const jobDescription = `${jobData.jobTitle}\\n${jobData.description}`;
      const scoreResult = await this.scoringService.scoreResume(resumeText, jobDescription);

      // 5. Save Score
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          aiScore: scoreResult.score,
          aiScoreData: {
            score: scoreResult.score,
            reasoning: scoreResult.reasoning,
            scoredAt: new Date().toISOString()
          }
        }
      });

      this.logger.log(`Successfully scored application ${applicationId}: ${scoreResult.score}`);
    } catch (error) {
      this.logger.error(`Failed to score application ${applicationId}`, error);
      throw error; // Let bull retry
    }
  }
}
