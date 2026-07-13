import { Injectable, Logger } from '@nestjs/common';
import { OllamaProvider } from '@cykruit/ai';
import { z } from 'zod';

const ParsedResumeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  summary: z.string().optional(),
  experiences: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string().optional(),
        startDate: z.string().describe("Format: YYYY-MM"),
        endDate: z.string().optional().describe("Format: YYYY-MM or empty"),
        isCurrent: z.boolean(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        school: z.string(),
        startDate: z.string().optional().describe("Format: YYYY"),
        endDate: z.string().optional().describe("Format: YYYY"),
      }),
    )
    .optional(),
  skills: z.array(z.string()).optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        issueDate: z.string().optional(),
      }),
    )
    .optional(),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  constructor(private readonly llmProvider: OllamaProvider) {}

  async parseResume(resumeText: string): Promise<ParsedResume> {
    const prompt = `
You are an expert ATS (Applicant Tracking System) parser.
Extract the following information from the provided resume text and format it as structured JSON.
Ensure you accurately identify skills, work experience, education, and personal details.

RESUME TEXT:
${resumeText}
`;

    try {
      this.logger.debug("Parsing resume with LLM...");
      const result = await this.llmProvider.generateStructured<ParsedResume>(prompt, ParsedResumeSchema);
      return result;
    } catch (error) {
      this.logger.error("Failed to parse resume", error);
      throw error;
    }
  }
}
