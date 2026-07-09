// libs/ai/src/providers/bedrock.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  AIProvider,
  AIGenerateOptions,
  AIGenerateResponse,
} from "./ai-provider.interface";
import { AI_PROMPTS } from "../constants/ai.constants";

@Injectable()
export class AWSBedrockProvider extends AIProvider {
  private readonly logger = new Logger(AWSBedrockProvider.name);
  private model: ChatBedrockConverse;

  constructor(private configService: ConfigService) {
    super();
    const region = this.configService.get<string>("ai.bedrock.region");
    const accessKeyId = this.configService.get<string>("ai.bedrock.accessKeyId");
    const secretAccessKey = this.configService.get<string>("ai.bedrock.secretAccessKey");
    const modelId = this.configService.get<string>("ai.bedrock.modelId", "us.anthropic.claude-haiku-4-5-20251001-v1:0");

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn("AWS Bedrock credentials not fully configured");
    }

    this.model = new ChatBedrockConverse({
      model: modelId,
      region: region || "us-east-1",
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions,
  ): Promise<AIGenerateResponse> {
    try {
      const model = options ? new ChatBedrockConverse({
        model: this.configService.get<string>("ai.bedrock.modelId", "us.anthropic.claude-haiku-4-5-20251001-v1:0"),
        region: this.configService.get<string>("ai.bedrock.region") || "us-east-1",
        credentials: {
          accessKeyId: this.configService.get<string>("ai.bedrock.accessKeyId") || "",
          secretAccessKey: this.configService.get<string>("ai.bedrock.secretAccessKey") || "",
        },
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        topP: options.topP,
      }) : this.model;

      const response = await model.invoke([new HumanMessage(prompt)]);
      
      const usage = response.usage_metadata as any;
      return {
        text: response.content as string,
        usage: {
          inputTokens: usage?.input_tokens || 0,
          outputTokens: usage?.output_tokens || 0,
        },
      };
    } catch (error: any) {
      this.logger.error("Bedrock API error:", error.message);
      throw error;
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: any,
    options?: AIGenerateOptions,
  ): Promise<T> {
    try {
      const model = options ? new ChatBedrockConverse({
        model: this.configService.get<string>("ai.bedrock.modelId", "us.anthropic.claude-haiku-4-5-20251001-v1:0"),
        region: this.configService.get<string>("ai.bedrock.region") || "us-east-1",
        credentials: {
          accessKeyId: this.configService.get<string>("ai.bedrock.accessKeyId") || "",
          secretAccessKey: this.configService.get<string>("ai.bedrock.secretAccessKey") || "",
        },
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        topP: options.topP,
      }) : this.model;

      const structuredModel = model.withStructuredOutput(schema, {
        name: "extract",
      });

      const response = await structuredModel.invoke([
        new HumanMessage(prompt),
      ]);

      return response as T;
    } catch (error: any) {
      this.logger.error("Bedrock Structured API error:", error.message);
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
    const prompt = AI_PROMPTS.JOB_DESCRIPTION({
      ...params,
      workMode: params.workMode || "Remote",
    });
    const response = await this.generate(prompt, { temperature: 0.7, maxTokens: 2048 });
    return response.text;
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      // Bedrock Claude can natively read document bytes using ChatBedrockConverse
      const response = await this.model.invoke([
        new HumanMessage({
          content: [
            { type: "text", text: AI_PROMPTS.PDF_EXTRACTION },
            {
              type: "document",
              document: {
                format: "pdf",
                name: "resume",
                source: {
                  bytes: new Uint8Array(pdfBuffer),
                }
              }
            }
          ]
        })
      ]);

      return response.content as string;
    } catch (error: any) {
      this.logger.error("Bedrock PDF parsing error:", error.message);
      throw error;
    }
  }
}
