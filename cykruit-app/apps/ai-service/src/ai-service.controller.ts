import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiServiceService } from './ai-service.service';
import { ResumeParserService } from './services/resume-parser.service';
import { JobAssistantService } from './services/job-assistant.service';

@Controller('ai')
export class AiServiceController {
  constructor(
    private readonly aiService: AiServiceService,
    private readonly resumeParserService: ResumeParserService,
    private readonly jobAssistantService: JobAssistantService,
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
}
