import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AiServiceModule } from './ai-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AiServiceModule);

  const config = new DocumentBuilder()
    .setTitle('AI Service API')
    .setDescription('The AI service endpoints')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.port ?? 3005;
  await app.listen(port);

  const httpServer = app.getHttpAdapter().getInstance() as import('express').Application;
  httpServer.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
bootstrap();
