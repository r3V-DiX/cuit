import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiServiceService } from './ai-service.service';
import { ResumeParserService } from './services/resume-parser.service';
import { JobAssistantService } from './services/job-assistant.service';
import { SeekerAssistantService } from './services/seeker-assistant.service';

@Controller('ai')
export class AiServiceController {
  constructor(
    private readonly aiService: AiServiceService,
    private readonly resumeParserService: ResumeParserService,
    private readonly jobAssistantService: JobAssistantService,
    private readonly seekerAssistantService: SeekerAssistantService,
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
}
