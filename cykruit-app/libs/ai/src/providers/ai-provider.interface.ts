// libs/ai/providers/ai-provider.interface.ts
import { AITaskTier } from "../constants/ai.constants";

export interface AIGenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  tier?: AITaskTier;
}

export interface AIGenerateResponse {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export abstract class AIProvider {
  abstract generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse>;

  abstract generateStructured<T>(
    prompt: string,
    schema: unknown,
    options?: AIGenerateOptions,
  ): Promise<T>;

  abstract generateJobDescription(params: {
    jobTitle: string;
    roleDescription: string;
    experienceLevel: string;
    workMode?: string;
    requiredSkills?: string[];
    preferredCertifications?: string[];
  }): Promise<string>;

  abstract extractTextFromPDF(pdfBuffer: Buffer): Promise<string>;
}
