import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { Public, Roles, RolesGuard } from '@cykruit/auth-core';
import { UserRole } from '@prisma/client';
import { AiServiceService } from './ai-service.service';
import { ResumeParserService } from './services/resume-parser.service';
import { JobAssistantService } from './services/job-assistant.service';
import { SeekerAssistantService } from './services/seeker-assistant.service';
import { MatchService } from './services/match.service';
import { AiScoringGuard } from './guards/ai-scoring.guard';

@Controller('ai')
export class AiServiceController {
  constructor(
    private readonly aiService: AiServiceService,
    private readonly resumeParserService: ResumeParserService,
    private readonly jobAssistantService: JobAssistantService,
    private readonly seekerAssistantService: SeekerAssistantService,
    private readonly matchService: MatchService,
  ) {}

  // ── Internal / queue-triggered (no user session) ─────────────────────────

  @Public()
  @Post('embed/query')
  async embedQuery(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('Text is required');
    }
    const vector = await this.aiService.getEmbedding(text);
    return { vector };
  }

  @Public()
  @Post('resume/parse')
  async parseResume(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('Text is required');
    }
    return this.resumeParserService.parseResume(text);
  }

  @Public()
  @Post('match-score')
  async getMatchScore(@Body() body: { seekerId: string, jobId: string }) {
    if (!body.seekerId || !body.jobId) {
      throw new BadRequestException('seekerId and jobId are required');
    }
    return this.matchService.matchSeekerToJob(body.seekerId, body.jobId);
  }

  @Public()
  @Post('jobs/recommend')
  async getRecommendedJobs(@Body() body: { seekerId: string, limit?: number }) {
    if (!body.seekerId) {
      throw new BadRequestException('seekerId is required');
    }
    return this.matchService.getRecommendedJobs(body.seekerId, body.limit || 3);
  }

  // ── Seeker profile AI (internal — called server-to-server by seeker-profile-service) ──
  // seeker-profile-service enforces SEEKER auth on its own controller before calling these.

  @Public()
  @Post('profile/generate-bio')
  async generateBio(@Body() body: { title: string, skills: string[], experienceTitles: string[] }) {
    return this.seekerAssistantService.generateBio(body.title, body.skills, body.experienceTitles);
  }

  @Public()
  @Post('profile/suggest-skills')
  async suggestSkills(@Body() body: { title: string, currentSkills: string[] }) {
    return this.seekerAssistantService.suggestSkills(body.title, body.currentSkills);
  }

  @Public()
  @Post('profile/tips')
  async getProfileTips(@Body() body: { title: string, missingSections: string[] }) {
    return this.seekerAssistantService.getProfileTips(body.title, body.missingSections);
  }

  // ── Employer-facing AI (auth + EMPLOYER role + paid-plan required) ────────

  @UseGuards(RolesGuard, AiScoringGuard)
  @Roles(UserRole.EMPLOYER)
  @Post('job-description/generate')
  async generateJobDescription(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new BadRequestException('Prompt is required');
    }
    return this.jobAssistantService.generateJobDescription(prompt);
  }

  @UseGuards(RolesGuard, AiScoringGuard)
  @Roles(UserRole.EMPLOYER)
  @Post('jobs/improve-description')
  async improveJobDescription(@Body() body: { title: string, description: string, jobType?: string, experienceLevel?: string }) {
    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required');
    }
    return this.jobAssistantService.improveJobDescription(body.title, body.description, body.jobType, body.experienceLevel);
  }

  @UseGuards(RolesGuard, AiScoringGuard)
  @Roles(UserRole.EMPLOYER)
  @Post('jobs/infer-domain')
  async inferDomain(@Body() body: { title: string }) {
    if (!body.title) {
      throw new BadRequestException('Title is required');
    }
    return this.jobAssistantService.inferDomain(body.title);
  }

  @UseGuards(RolesGuard, AiScoringGuard)
  @Roles(UserRole.EMPLOYER)
  @Post('jobs/suggest-skills')
  async suggestJobSkills(@Body() body: { title: string, description: string }) {
    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required');
    }
    return this.jobAssistantService.suggestJobSkills(body.title, body.description);
  }

  @UseGuards(RolesGuard, AiScoringGuard)
  @Roles(UserRole.EMPLOYER)
  @Post('jobs/generate-questions')
  async generateScreeningQuestions(@Body() body: { title: string, description?: string }) {
    if (!body.title) {
      throw new BadRequestException('Title is required');
    }
    return this.jobAssistantService.generateScreeningQuestions(body.title, body.description);
  }
}
