import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config as loadDotenv } from 'dotenv';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { runPendingMigrations } from './database/run-migrations';
const compression = require('compression');

// Load .env before migrations (EC2/prod usually already has process.env set)
loadDotenv();

// Enterprise Inquiries & Scorecard Contact module enabled
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Auto-migrate on every boot (local + production). Set AUTO_MIGRATE=false to skip.
  const autoMigrate = String(process.env.AUTO_MIGRATE ?? 'true').toLowerCase() !== 'false';
  if (autoMigrate) {
    try {
      const result = await runPendingMigrations();
      if (result.applied.length) {
        logger.log(`Applied ${result.applied.length} migration(s): ${result.applied.join(', ')}`);
      } else {
        logger.log('Database migrations up to date.');
      }
    } catch (err: any) {
      logger.error(`Migration failed — refusing to start: ${err?.message || err}`);
      process.exit(1);
    }
  } else {
    logger.warn('AUTO_MIGRATE=false — skipping migrations on boot.');
  }

  const app = await NestFactory.create(AppModule);

  // Enable HTTP Gzip compression for fast payloads
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Interceptors & Filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation Setup (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Rose Associates — Prosperity Builder Scorecard API')
      .setDescription('NestJS REST API microservice for real-estate project assessments, dynamic template schemas, conditional rules, scoring, and analytics.')
      .setVersion('1.0')
      .addTag('Projects')
      .addTag('Templates')
      .addTag('Analytics')
      .addTag('Settings')
      .addTag('Sample Data Seed')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT;
  await app.listen(port);
  logger.log(`NestJS Backend Application running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Swagger API Documentation available at: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
