import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiServiceService } from './ai-service.service';
import { ResumeParserService } from './services/resume-parser.service';
import { JobAssistantService } from './services/job-assistant.service';
import { SeekerAssistantService } from './services/seeker-assistant.service';
import { MatchService } from './services/match.service';

@Controller('ai')
export class AiServiceController {
  constructor(
    private readonly aiService: AiServiceService,
    private readonly resumeParserService: ResumeParserService,
    private readonly jobAssistantService: JobAssistantService,
    private readonly seekerAssistantService: SeekerAssistantService,
    private readonly matchService: MatchService,
  ) {}

  @Post('embed/query')
  async embedQuery(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('Text is required');
    }
    const vector = await this.aiService.getEmbedding(text);
    return { vector };
  }

  @Post('resume/parse')
  async parseResume(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('Text is required');
    }
    return this.resumeParserService.parseResume(text);
  }

  @Post('job-description/generate')
  async generateJobDescription(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new BadRequestException('Prompt is required');
    }
    return this.jobAssistantService.generateJobDescription(prompt);
  }

  @Post('jobs/improve-description')
  async improveJobDescription(@Body() body: { title: string, description: string, jobType?: string, experienceLevel?: string }) {
    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required');
    }
    return this.jobAssistantService.improveJobDescription(body.title, body.description, body.jobType, body.experienceLevel);
  }

  @Post('jobs/suggest-skills')
  async suggestJobSkills(@Body() body: { title: string, description: string }) {
    if (!body.title || !body.description) {
      throw new BadRequestException('Title and description are required');
    }
    return this.jobAssistantService.suggestJobSkills(body.title, body.description);
  }

  @Post('profile/generate-bio')
  async generateBio(@Body() body: { title: string, skills: string[], experienceTitles: string[] }) {
    return this.seekerAssistantService.generateBio(body.title, body.skills, body.experienceTitles);
  }

  @Post('profile/suggest-skills')
  async suggestSkills(@Body() body: { title: string, currentSkills: string[] }) {
    return this.seekerAssistantService.suggestSkills(body.title, body.currentSkills);
  }

  @Post('profile/tips')
  async getProfileTips(@Body() body: { title: string, missingSections: string[] }) {
    return this.seekerAssistantService.getProfileTips(body.title, body.missingSections);
  }

  @Post('match-score')
  async getMatchScore(@Body() body: { seekerId: string, jobId: string }) {
    if (!body.seekerId || !body.jobId) {
      throw new BadRequestException('seekerId and jobId are required');
    }
    return this.matchService.matchSeekerToJob(body.seekerId, body.jobId);
  }
}
