import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BedrockEmbeddings } from "@langchain/aws";
import { OllamaEmbeddings } from "@langchain/ollama";

export interface IEmbeddingProvider {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

@Injectable()
export class EmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(EmbeddingProvider.name);
  private embeddingsModel: BedrockEmbeddings | OllamaEmbeddings;
  private readonly targetDimension = 1536;

  constructor(private configService: ConfigService) {
    const providerStr = this.configService.get<string>("ai.provider");

    if (providerStr === "bedrock") {
      const region = this.configService.get<string>("ai.bedrock.region") || "us-east-1";
      const accessKeyId = this.configService.get<string>("ai.bedrock.accessKeyId");
      const secretAccessKey = this.configService.get<string>("ai.bedrock.secretAccessKey");
      const model = this.configService.get<string>("BEDROCK_EMBEDDING_MODEL") || "amazon.titan-embed-text-v2:0";

      // Explicit credentials override the SDK default chain, so only pass them when
      // both keys are configured (local dev); on EC2 the instance role authenticates.
      this.embeddingsModel = new BedrockEmbeddings({
        region,
        model,
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
      });
    } else {
      // Default to Local Ollama model for development
      const baseUrl = this.configService.get<string>("OLLAMA_BASE_URL") || "http://127.0.0.1:11434";
      const model = this.configService.get<string>("OLLAMA_EMBEDDING_MODEL") || "nomic-embed-text";

      this.embeddingsModel = new OllamaEmbeddings({
        baseUrl,
        model,
      });
    }
  }
  private padVector(vector: number[]): number[] {
    if (vector.length === this.targetDimension) return vector;
    if (vector.length > this.targetDimension) {
      return vector.slice(0, this.targetDimension);
    }
    const padded = new Array(this.targetDimension).fill(0);
    for (let i = 0; i < vector.length; i++) {
      padded[i] = vector[i];
    }
    return padded;
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      const vector = await this.embeddingsModel.embedQuery(text);
      return this.padVector(vector);
    } catch (error) {
      this.logger.error("Failed to embed query", error);
      throw error;
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      const vectors = await this.embeddingsModel.embedDocuments(texts);
      return vectors.map(v => this.padVector(v));
    } catch (error) {
      this.logger.error("Failed to embed documents", error);
      throw error;
    }
  }
}
