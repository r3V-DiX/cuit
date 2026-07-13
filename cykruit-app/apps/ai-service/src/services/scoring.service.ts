import { Injectable, Logger } from '@nestjs/common';
import { OllamaProvider } from '@cykruit/ai';
import { z } from 'zod';

const ScoringSchema = z.object({
  score: z.number().min(0).max(100).describe("A score from 0 to 100 indicating the candidate's fit for the job"),
  reasoning: z.string().describe("A short paragraph explaining the score based on skills, experience, and job requirements"),
});

export type ScoringResult = z.infer<typeof ScoringSchema>;

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly llmProvider: OllamaProvider) {}

  async scoreResume(resumeText: string, jobDescription: string): Promise<ScoringResult> {
    const prompt = `
You are an expert technical recruiter and AI scoring system.
Evaluate the following resume against the provided job description.
Provide a match score from 0 to 100, and a concise reasoning paragraph explaining why.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;
    try {
      this.logger.debug("Calling LLM for scoring...");
      const result = await this.llmProvider.generateStructured<ScoringResult>(prompt, ScoringSchema);
      return result;
    } catch (error) {
      this.logger.error("Failed to score resume", error);
      throw error;
    }
  }
}
