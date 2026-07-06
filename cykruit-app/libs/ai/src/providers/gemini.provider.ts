// libs/ai/providers/gemini.provider.ts
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import {
  AIProvider,
  AIGenerateOptions,
  AIGenerateResponse,
} from "./ai-provider.interface";
import { AI_PROMPTS } from "../constants/ai.constants";

@Injectable()
export class GeminiProvider extends AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private modelName: string;

  constructor(private configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>("ai.gemini.apiKey");
    this.modelName = this.configService.get<string>(
      "ai.gemini.model",
      "gemini-2.5-flash",
    );

    if (!this.apiKey) throw new Error("Gemini API key not configured");
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    try {
      const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const res = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: options?.maxTokens || 4096,
            temperature: options?.temperature || 0.7,
            topP: options?.topP || 0.95,
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 },
      );

      const text = res.data.candidates[0].content.parts[0].text;
      const usage = res.data.usageMetadata || {};
      return {
        text,
        usage: {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
        },
      };
    } catch (error) {
      this.logger.error("Gemini API error:", error.message);
      throw new BadRequestException(
        `Gemini error: ${error.response?.data?.error?.message || error.message}`,
      );
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
    const res = await this.generate(
      AI_PROMPTS.JOB_DESCRIPTION({ workMode: "REMOTE", ...params }),
      { maxTokens: 4096, temperature: 0.7 },
    );
    return res.text;
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const res = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBuffer.toString("base64"),
                  },
                },
                { text: AI_PROMPTS.PDF_EXTRACTION },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
        },
        { timeout: 60000 },
      );

      let text = res.data.candidates[0].content.parts[0].text as string;
      text = text
        .replace(/```html\n?/gi, "")
        .replace(/```\n?$/g, "")
        .trim();
      return text;
    } catch (error) {
      this.logger.error("PDF extraction error:", error.message);
      throw new BadRequestException(`PDF extraction failed: ${error.message}`);
    }
  }
}
