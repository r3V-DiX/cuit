import { Injectable, Logger } from '@nestjs/common';
import { OllamaProvider } from '@cykruit/ai';
import { z } from 'zod';

const JobDescriptionSchema = z.object({
  jobTitle: z.string(),
  description: z.string().describe("A well-formatted, professional job description"),
  skills: z.array(z.string()).describe("A list of recommended skills for this job"),
});

export type GeneratedJob = z.infer<typeof JobDescriptionSchema>;

@Injectable()
export class JobAssistantService {
  private readonly logger = new Logger(JobAssistantService.name);

  constructor(private readonly llmProvider: OllamaProvider) {}

  async generateJobDescription(promptText: string): Promise<GeneratedJob> {
    const prompt = `
You are an expert HR assistant. Write a professional job description based on the following notes or prompt.
Ensure the output includes a clear job title, a detailed description (including responsibilities and requirements), and a list of key skills.

PROMPT:
${promptText}
`;

    try {
      this.logger.debug("Generating job description with LLM...");
      const result = await this.llmProvider.generateStructured<GeneratedJob>(prompt, JobDescriptionSchema);
      return result;
    } catch (error) {
      this.logger.error("Failed to generate job description", error);
      throw error;
    }
  }
}
