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
    const providerStr = this.configService.get<string>("ai.provider");
    
    // Only Ollama (dev) or Bedrock (prod)
    if (providerStr === "ollama") {
      return this.ollamaProvider;
    }
    
    // Default to Bedrock
    return this.awsBedrockProvider;
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    const provider = this.getProviderForTier(options?.tier);
    return await provider.generate(prompt, options);
  }

  async generateStructured<T>(
    prompt: string,
    schema: unknown,
    options?: AIGenerateOptions,
  ): Promise<T> {
    const provider = this.getProviderForTier(options?.tier);
    return await provider.generateStructured<T>(prompt, schema, options);
  }

  async generateJobDescription(params: {
    jobTitle: string;
    roleDescription: string;
    experienceLevel: string;
    workMode?: string;
    requiredSkills?: string[];
    preferredCertifications?: string[];
  }): Promise<string> {
    const provider = this.getProviderForTier(AITaskTier.HEAVY);
    return provider.generateJobDescription(params);
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    const LLAMA_CLOUD_API_KEY = this.configService.get<string>("LLAMA_CLOUD_API_KEY");

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
          body: formData,
        });
        if (!uploadRes.ok) throw new Error(`LlamaParse upload failed: ${uploadRes.statusText}`);
        const uploadData = await uploadRes.json() as { id: string };
        const jobId = uploadData.id;

        while (true) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
            headers: { 'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}` }
          });
          const statusData = await statusRes.json() as { status: string; markdown?: string };
          if (statusData.status === 'SUCCESS') {
            const textRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
              headers: { 'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}` }
            });
            const textData = await textRes.json() as { markdown: string };
            return textData.markdown;
          } else if (statusData.status === 'ERROR') {
            throw new Error('LlamaParse job failed');
          }
        }
      } catch (error: unknown) {
        console.warn(`[AIService] LlamaParse failed, falling back to Bedrock/Gemini:`, (error as Error).message);
      }
    }

    const provider = this.getProviderForTier(AITaskTier.HEAVY);
    return provider.extractTextFromPDF(pdfBuffer);
  }
}
