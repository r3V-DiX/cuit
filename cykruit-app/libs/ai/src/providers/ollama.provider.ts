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
export class OllamaProvider implements AIProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private model: ChatOpenAI;
  private modelName: string;

  constructor(private configService: ConfigService) {
    // Ollama's OpenAI-compatible endpoint requires /v1
    const envBase = this.configService.get<string>("OLLAMA_BASE_URL") || "http://127.0.0.1:11434";
    const baseURL = envBase.endsWith("/v1") ? envBase : `${envBase}/v1`;
    this.modelName = this.configService.get<string>("OLLAMA_MODEL_NAME") || "llama3.1:8b";
    const apiKey = "ollama"; // Dummy key

    this.model = new ChatOpenAI({
      apiKey: apiKey,
      configuration: {
        baseURL: baseURL,
      },
      modelName: this.modelName,
      temperature: 0.7,
      maxRetries: 1,
    });
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    try {
      const envBase = this.configService.get<string>("OLLAMA_BASE_URL") || "http://127.0.0.1:11434";
      const baseURL = envBase.endsWith("/v1") ? envBase : `${envBase}/v1`;
      const chatModel = options
        ? new ChatOpenAI({
            apiKey: "ollama",
            configuration: {
              baseURL: baseURL,
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
      this.logger.error("Ollama generation failed", error);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: any, // ZodSchema
    options?: AIGenerateOptions,
  ): Promise<T> {
    try {
      const envBase = this.configService.get<string>("OLLAMA_BASE_URL") || "http://127.0.0.1:11434";
      const baseURL = envBase.endsWith("/v1") ? envBase : `${envBase}/v1`;
      const chatModel = options
        ? new ChatOpenAI({
            apiKey: "ollama",
            configuration: {
              baseURL: baseURL,
            },
            modelName: this.modelName,
            temperature: options.temperature ?? 0.1,
            maxTokens: options.maxTokens,
            topP: options.topP,
          })
        : new ChatOpenAI({
            apiKey: "ollama",
            configuration: {
              baseURL: baseURL,
            },
            modelName: this.modelName,
            temperature: 0.1,
          });

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
      this.logger.error("Ollama structured generation failed", error);
      throw new Error(`Ollama structured generation failed: ${error.message}`);
    }
  }

  async generateJobDescription(): Promise<string> {
    throw new Error("generateJobDescription should be handled by the heavy model");
  }

  async extractTextFromPDF(): Promise<string> {
    throw new Error("extractTextFromPDF should be handled by the heavy model");
  }
}
