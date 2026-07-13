import { Injectable, Logger } from '@nestjs/common';
import { AIService, AI_PROMPTS, AITaskTier } from '@cykruit/ai';
import { z } from 'zod';

@Injectable()
export class SeekerAssistantService {
  private readonly logger = new Logger(SeekerAssistantService.name);

  constructor(private readonly aiService: AIService) {}

  async generateBio(title: string, skills: string[], experienceTitles: string[]): Promise<string> {
    const prompt = AI_PROMPTS.BIO_GENERATE({
      title: title || "Cybersecurity Professional",
      skills,
      experienceTitles,
    });

    const res = await this.aiService.generate(prompt, { tier: AITaskTier.SMALL });
    
    let cleanedBio = res.text.trim();
    
    // Remove conversational filler if the AI ignores strict prompt instructions
    if (cleanedBio.toLowerCase().startsWith("here") || cleanedBio.toLowerCase().startsWith("sure") || cleanedBio.toLowerCase().startsWith("certainly")) {
      const parts = cleanedBio.split("\n\n");
      if (parts.length > 1) {
        parts.shift(); // Remove the introductory paragraph
        cleanedBio = parts.join("\n\n").trim();
      } else {
        cleanedBio = cleanedBio.replace(/^(here|sure|certainly).*?:/i, '').trim();
      }
    }
    
    // Remove wrapping quotes if present
    cleanedBio = cleanedBio.replace(/^["']|["']$/g, '').trim();
    
    return cleanedBio;
  }

  async suggestSkills(title: string, currentSkills: string[]): Promise<string[]> {
    const prompt = AI_PROMPTS.SKILL_SUGGEST({
      title: title || "Cybersecurity Professional",
      currentSkills,
    });

    const schema = z.object({
      suggestions: z.array(z.string()).describe("Array of core technology names"),
    });

    const result = await this.aiService.generateStructured<any>(prompt, schema, { tier: AITaskTier.SMALL });
    
    // Normalize result (Ollama sometimes wraps or renames the key)
    let skillsList: string[] = [];
    if (Array.isArray(result)) {
      skillsList = result;
    } else if (result && typeof result === 'object') {
      skillsList = result.suggestions || result.output || result.skills || Object.values(result)[0] || [];
      if (!Array.isArray(skillsList)) skillsList = [];
    }
    
    return skillsList;
  }

  async getProfileTips(title: string, missingSections: string[]): Promise<string[]> {
    if (missingSections.length === 0) {
       return ["Your profile is looking strong! Consider adding more detailed achievements to your experiences."];
    }

    const prompt = AI_PROMPTS.PROFILE_TIPS({
      title: title || "Candidate",
      missingSections,
    });

    const res = await this.aiService.generate(prompt, { tier: AITaskTier.SMALL });
    const tips = res.text
        .split('\n')
        .map(t => t.replace(/^- /, '').replace(/^\* /, '').trim())
        .filter(t => t.length > 0);

    return tips;
  }
}
