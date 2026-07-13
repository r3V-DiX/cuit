// libs/ai/ai.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GeminiProvider } from "./providers/gemini.provider";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { AWSBedrockProvider } from "./providers/bedrock.provider";
import {
  AIProvider,
  AIGenerateOptions,
  AIGenerateResponse,
} from "./providers/ai-provider.interface";
import { AITaskTier } from "./constants/ai.constants";

@Injectable()
export class AIService {
  constructor(
    private configService: ConfigService,
    private geminiProvider: GeminiProvider,
    private openRouterProvider: OpenRouterProvider,
    private ollamaProvider: OllamaProvider,
    private awsBedrockProvider: AWSBedrockProvider,
  ) {}

  private getProviderForTier(tier?: AITaskTier): AIProvider {
    if (tier === AITaskTier.SMALL) {
      if (this.configService.get<string>("USE_OLLAMA") === "true" || process.env.USE_OLLAMA === "true") {
        return this.ollamaProvider;
      }
      return this.openRouterProvider;
    }
    // Heavy tasks go to Bedrock, or fallback to Gemini if Bedrock is not configured
    if (this.configService.get<string>("ai.bedrock.accessKeyId") || process.env.BEDROCK_AWS_ACCESS_KEY_ID) {
      return this.awsBedrockProvider;
    }
    return this.geminiProvider;
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    const provider = this.getProviderForTier(options?.tier);
    try {
      return await provider.generate(prompt, options);
    } catch (error) {
      if (provider !== this.geminiProvider) {
        // Fallback to Gemini if primary fails
        console.warn(`[AIService] ${provider.constructor.name} failed, falling back to GeminiProvider:`, error.message);
        return this.geminiProvider.generate(prompt, options);
      }
      throw error;
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: any,
    options?: AIGenerateOptions,
  ): Promise<T> {
    const provider = this.getProviderForTier(options?.tier);
    try {
      return await provider.generateStructured<T>(prompt, schema, options);
    } catch (error) {
      if (provider !== this.geminiProvider) {
        // Fallback to Gemini if primary fails
        console.warn(`[AIService] ${provider.constructor.name} structured generation failed, falling back to GeminiProvider:`, error.message);
        return this.geminiProvider.generateStructured<T>(prompt, schema, options);
      }
      throw error;
    }
  }

  async generateJobDescription(params: {
    jobTitle: string;
    roleDescription: string;
    experienceLevel: string;
    workMode?: string;
    requiredSkills?: string[];
    preferredCertifications?: string[];
  }): Promise<string> {
    // Heavy task, use Bedrock
    if (this.configService.get<string>("ai.bedrock.accessKeyId") || process.env.BEDROCK_AWS_ACCESS_KEY_ID) {
      try {
        return await this.awsBedrockProvider.generateJobDescription(params);
      } catch (error) {
        console.warn(`[AIService] Bedrock generateJobDescription failed, falling back to Gemini:`, error.message);
      }
    }
    return this.geminiProvider.generateJobDescription(params);
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    const LLAMA_CLOUD_API_KEY = this.configService.get<string>("LLAMA_CLOUD_API_KEY") || process.env.LLAMA_CLOUD_API_KEY;
    
    if (LLAMA_CLOUD_API_KEY) {
      try {
        const formData = new FormData();
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('file', blob, 'resume.pdf');
      
      const uploadRes = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        },
        body: formData as any,
      });
      if (!uploadRes.ok) throw new Error(`LlamaParse upload failed: ${uploadRes.statusText}`);
      const uploadData = await uploadRes.json() as any;
      const jobId = uploadData.id;

      while (true) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
          headers: { 'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}` }
        });
        const statusData = await statusRes.json() as any;
        if (statusData.status === 'SUCCESS') {
          const textRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
            headers: { 'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}` }
          });
          const textData = await textRes.json() as any;
          return textData.markdown;
        } else if (statusData.status === 'ERROR') {
          throw new Error('LlamaParse job failed');
        }
      }
    } catch (error: any) {
      console.warn(`[AIService] LlamaParse failed, falling back to Bedrock/Gemini:`, error.message);
    }
    }

    // Heavy task, use Bedrock natively if available
    if (this.configService.get<string>("ai.bedrock.accessKeyId") || process.env.BEDROCK_AWS_ACCESS_KEY_ID) {
      try {
        return await this.awsBedrockProvider.extractTextFromPDF(pdfBuffer);
      } catch (error: any) {
        console.warn(`[AIService] Bedrock PDF extract failed, falling back to Gemini:`, error.message);
      }
    }
    return this.geminiProvider.extractTextFromPDF(pdfBuffer);
  }
}
