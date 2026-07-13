import { Injectable, Logger } from '@nestjs/common';
import { OllamaProvider } from '@cykruit/ai';
import { z } from 'zod';

const JobDescriptionSchema = z.object({
  jobTitle: z.string(),
  description: z.string().describe("A well-formatted, professional job description"),
  skills: z.array(z.string()).describe("A list of recommended skills for this job"),
});

export type GeneratedJob = z.infer<typeof JobDescriptionSchema>;

const ImproveDescriptionSchema = z.object({
  improvedDescription: z.string().describe("The improved job description"),
  suggestions: z.array(z.string()).describe("A list of suggestions for phrasing and content"),
  missingFields: z.array(z.string()).describe("A list of critical details missing from the description"),
});

export type ImprovedJobDescription = z.infer<typeof ImproveDescriptionSchema>;

const SuggestedSkillsSchema = z.object({
  skills: z.array(z.string()).describe("Top 10 recommended skills for this job"),
});

export type SuggestedSkills = z.infer<typeof SuggestedSkillsSchema>;
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

  async improveJobDescription(title: string, description: string, jobType?: string, experienceLevel?: string): Promise<ImprovedJobDescription> {
    const prompt = `
You are a hiring expert. Improve this job description for clarity and completeness.
Title: ${title}
Job Type: ${jobType || 'Not specified'}
Experience Level: ${experienceLevel || 'Not specified'}

Current Description:
${description}
`;

    try {
      this.logger.debug("Improving job description with LLM...");
      return await this.llmProvider.generateStructured<ImprovedJobDescription>(prompt, ImproveDescriptionSchema);
    } catch (error) {
      this.logger.error("Failed to improve job description", error);
      throw error;
    }
  }

  async suggestJobSkills(title: string, description: string): Promise<SuggestedSkills> {
    const prompt = `
Based on this job title and description, list the top 10 most relevant technical and soft skills.
Title: ${title}

Description:
${description}
`;

    try {
      this.logger.debug("Suggesting job skills with LLM...");
      return await this.llmProvider.generateStructured<SuggestedSkills>(prompt, SuggestedSkillsSchema);
    } catch (error) {
      this.logger.error("Failed to suggest job skills", error);
      throw error;
    }
  }
}
