import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import {
  AIProvider,
  AIGenerateOptions,
  AIGenerateResponse,
} from "./ai-provider.interface";

@Injectable()
export class OpenRouterProvider implements AIProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private model: ChatOpenAI;
  private modelName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENROUTER_API_KEY");
    this.modelName =
      this.configService.get<string>("OPENROUTER_MODEL_NAME") ||
      "meta-llama/llama-3.1-8b-instruct:free";

    if (!apiKey) {
      this.logger.warn("OPENROUTER_API_KEY is not defined in the environment. OpenRouter operations will fail.");
    }

    this.model = new ChatOpenAI({
      apiKey: apiKey,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      modelName: this.modelName,
      temperature: 0.7,
      maxRetries: 2,
    });
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    try {
      const chatModel = options
        ? new ChatOpenAI({
            apiKey: this.configService.get<string>("OPENROUTER_API_KEY"),
            configuration: {
              baseURL: "https://openrouter.ai/api/v1",
            },
            modelName: this.modelName,
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens,
            topP: options.topP,
          })
        : this.model;

      const response = await chatModel.invoke([new HumanMessage(prompt)]);

      const metadata = response.response_metadata as any;
      return {
        text: response.content as string,
        usage: metadata?.tokenUsage
          ? {
              inputTokens: metadata.tokenUsage.promptTokens,
              outputTokens: metadata.tokenUsage.completionTokens,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error("OpenRouter generation failed", error);
      throw new Error(`OpenRouter generation failed: ${error.message}`);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: any, // ZodSchema
    options?: AIGenerateOptions,
  ): Promise<T> {
    try {
      const chatModel = options
        ? new ChatOpenAI({
            apiKey: this.configService.get<string>("OPENROUTER_API_KEY"),
            configuration: {
              baseURL: "https://openrouter.ai/api/v1",
            },
            modelName: this.modelName,
            temperature: options.temperature ?? 0.1, // Default lower temp for structured
            maxTokens: options.maxTokens,
            topP: options.topP,
          })
        : new ChatOpenAI({
            apiKey: this.configService.get<string>("OPENROUTER_API_KEY"),
            configuration: {
              baseURL: "https://openrouter.ai/api/v1",
            },
            modelName: this.modelName,
            temperature: 0.1,
          });

      // LangChain's withStructuredOutput uses tools/function calling. OpenRouter models vary in their support.
      // `meta-llama/llama-3.1-8b-instruct:free` on OpenRouter does support function calling.
      const structuredModel = chatModel.withStructuredOutput(schema);

      const response = await structuredModel.invoke([new HumanMessage(prompt)]);
      
      let parsedResponse = response;
      if (typeof response === "string") {
        try {
          const jsonStr = (response as string).replace(/```json\n?|\n?```/g, "").trim();
          parsedResponse = JSON.parse(jsonStr);
        } catch (e) {
          this.logger.warn("Failed to parse string response as JSON", response);
        }
      }
      return parsedResponse as T;
    } catch (error) {
      this.logger.error("OpenRouter structured generation failed", error);
      throw new Error(
        `OpenRouter structured generation failed: ${error.message}`,
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
    throw new Error(
      "generateJobDescription should be handled by the heavy model (Gemini)",
    );
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    throw new Error(
      "extractTextFromPDF should be handled by the heavy model (Gemini)",
    );
  }
}
