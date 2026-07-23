// libs/ai/ai.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("ai", () => ({
  provider: process.env.AI_PROVIDER || (process.env.NODE_ENV === "production" ? "bedrock" : "ollama"),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "4096", 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
  },
  bedrock: {
    region: process.env.BEDROCK_AWS_REGION,
    accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY,
    modelLarge: process.env.BEDROCK_MODEL_LARGE || "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    modelSmall: process.env.BEDROCK_MODEL_SMALL || "us.anthropic.claude-haiku-4-5-20251001-v1:0",
  },
}));
