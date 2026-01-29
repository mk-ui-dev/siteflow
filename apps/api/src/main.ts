import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters (order matters - most specific last)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AppExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('SiteFlow API')
    .setDescription('Construction project management API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('projects', 'Project management')
    .addTag('tasks', 'Task management')
    .addTag('inspections', 'Inspection workflow')
    .addTag('issues', 'Issue tracking')
    .addTag('deliveries', 'Delivery management')
    .addTag('decisions', 'Decision approval workflow')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 API server running on http://localhost:${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
