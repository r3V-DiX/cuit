// libs/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';
import { AIProvider, AIGenerateOptions, AIGenerateResponse } from './providers/ai-provider.interface';
import { AIProviderType } from './constants/ai.constants';

@Injectable()
export class AIService {
    private provider: AIProvider;
    private currentProvider: AIProviderType;

    constructor(
        private configService: ConfigService,
        private geminiProvider: GeminiProvider,
    ) {
        const providerType = this.configService.get<AIProviderType>('ai.provider', AIProviderType.GEMINI);
        this.setProvider(providerType);
    }

    setProvider(provider: AIProviderType) {
        switch (provider) {
            case AIProviderType.GEMINI:
            default:
                this.provider = this.geminiProvider;
                this.currentProvider = provider;
        }
    }

    getCurrentProvider(): AIProviderType {
        return this.currentProvider;
    }

    async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResponse> {
        return this.provider.generate(prompt, options);
    }

    async generateJobDescription(params: {
        jobTitle: string; roleDescription: string; experienceLevel: string;
        workMode?: string; requiredSkills?: string[]; preferredCertifications?: string[];
    }): Promise<string> {
        return this.provider.generateJobDescription(params);
    }

    async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
        return this.provider.extractTextFromPDF(pdfBuffer);
    }
}