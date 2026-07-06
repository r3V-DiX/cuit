// libs/ai/ai.module.ts
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AIService } from "./ai.service";
import { GeminiProvider } from "./providers/gemini.provider";
import aiConfig from "./ai.config";

@Global()
@Module({
  imports: [ConfigModule.forFeature(aiConfig)],
  providers: [AIService, GeminiProvider],
  exports: [AIService],
})
export class AIModule {}
