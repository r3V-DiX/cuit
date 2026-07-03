// libs/ai/ai.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
    provider: process.env.AI_PROVIDER || 'gemini',
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10),
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    },
}));