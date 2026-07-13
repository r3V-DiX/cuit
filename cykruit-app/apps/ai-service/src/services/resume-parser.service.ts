import { Injectable, Logger } from '@nestjs/common';
import { OllamaProvider } from '@cykruit/ai';
import { z } from 'zod';

const ParsedResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  skills: z.array(z.string()).describe("List of technical and soft skills extracted from the resume"),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    graduationDate: z.string().optional(),
  })),
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
