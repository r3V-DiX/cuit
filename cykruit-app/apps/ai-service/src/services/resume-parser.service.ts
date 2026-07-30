import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@cykruit/ai';
import { z } from 'zod';

const ParsedResumeSchema = z.object({
  fullName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().describe("Job title / current role"),
  location: z.string().optional(),
  summary: z.string().describe("Professional summary / bio"),
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
  constructor(private readonly aiService: AIService) {}

  async parseResume(resumeText: string): Promise<ParsedResume> {
    const prompt = `
You are an expert ATS (Applicant Tracking System) parser.
Extract ALL of the following from the provided resume text and return structured JSON.
DO NOT skip any section — extract everything available:

- fullName, firstName, lastName
- email, phone
- title (current/most recent job title)
- location (city, state, country)
- summary (professional summary / bio / objective from top of resume)
- experiences (work history with title, company, dates, description)
- education (degrees, schools, years)
- skills (technical and soft skills)
- certifications (names, issuers, dates)

IMPORTANT: Do NOT extract social profile URLs (LinkedIn, GitHub, portfolio) or any personal websites.

RESUME TEXT:
${resumeText}
`;

    try {
      this.logger.debug("Parsing resume with LLM...");
      const result = await this.aiService.generateStructured<ParsedResume>(prompt, ParsedResumeSchema);
      return result;
    } catch (error) {
      this.logger.error("Failed to parse resume", error);
      throw error;
    }
  }
}
