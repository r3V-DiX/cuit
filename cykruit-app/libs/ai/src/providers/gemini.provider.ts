// libs/ai/src/providers/gemini.provider.ts
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import {
  AIProvider,
  AIGenerateOptions,
  AIGenerateResponse,
} from "./ai-provider.interface";
import { AI_PROMPTS } from "../constants/ai.constants";

@Injectable()
export class GeminiProvider extends AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private model: ChatGoogleGenerativeAI;
  
  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>("ai.gemini.apiKey");
    const modelName = this.configService.get<string>(
      "ai.gemini.model",
      "gemini-2.5-flash",
    );

    if (!apiKey) {
      this.logger.warn("Gemini API key not configured");
    }
    
    this.model = new ChatGoogleGenerativeAI({
      apiKey: apiKey || "dummy-key",
      model: modelName,
    });
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    try {
      const model = options ? new ChatGoogleGenerativeAI({
        apiKey: this.configService.get<string>("ai.gemini.apiKey"),
        model: this.configService.get<string>("ai.gemini.model", "gemini-2.5-flash"),
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.95,
      }) : this.model;

      const response = await model.invoke([new HumanMessage(prompt)]);
      
      const usage = response.usage_metadata as { input_tokens?: number; output_tokens?: number } | undefined;
      return {
        text: response.content as string,
        usage: {
          inputTokens: usage?.input_tokens ?? 0,
          outputTokens: usage?.output_tokens ?? 0,
        },
      };
    } catch (error: any) {
      this.logger.error("Gemini API error:", error.message);
      throw new BadRequestException(
        `Gemini error: ${error.message}`,
      );
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: unknown,
    options?: AIGenerateOptions,
  ): Promise<T> {
    try {
      const model = options ? new ChatGoogleGenerativeAI({
        apiKey: this.configService.get<string>("ai.gemini.apiKey"),
        model: this.configService.get<string>("ai.gemini.model", "gemini-2.5-flash"),
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.95,
      }) : this.model;

      const structuredModel = model.withStructuredOutput(schema);
      const response = await structuredModel.invoke([new HumanMessage(prompt)]);
      return response as T;
    } catch (error: any) {
      this.logger.error("Gemini API error (structured):", error.message);
      throw new BadRequestException(
        `Gemini error: ${error.message}`,
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
      const response = await this.model.invoke([
        new HumanMessage({
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
              },
            },
            {
              type: "text",
              text: AI_PROMPTS.PDF_EXTRACTION,
            },
          ],
        }),
      ]);

      let text = response.content as string;
      text = text
        .replace(/```html\n?/gi, "")
        .replace(/```\n?$/g, "")
        .trim();
      return text;
    } catch (error: any) {
      this.logger.error("PDF extraction error:", error.message);
      throw new BadRequestException(`PDF extraction failed: ${error.message}`);
    }
  }
}
