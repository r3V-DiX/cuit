// libs/ai/providers/ai-provider.interface.ts
export interface AIGenerateOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}

export interface AIGenerateResponse {
    text: string;
    usage?: { inputTokens: number; outputTokens: number };
}

export abstract class AIProvider {
    abstract generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResponse>;

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