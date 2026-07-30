import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AiServiceModule } from './ai-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AiServiceModule);
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('AI Service API')
    .setDescription('The AI service endpoints')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.port ?? 3005;

  // Registered before app.listen() — Nest finalizes its own routing (including
  // a catch-all 404 handler) as part of listen(), so a raw Express route added
  // afterward would never be reached; Nest's own 404 would win first.
  const httpServer = app.getHttpAdapter().getInstance() as import('express').Application;
  httpServer.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await app.listen(port);
}
bootstrap();
