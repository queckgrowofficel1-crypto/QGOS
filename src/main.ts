import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression = require('compression');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { requestContextMiddleware } from './common/request-context';
import { requestLoggingMiddleware } from './common/request-logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProduction = configService.get<string>('NODE_ENV', 'development') === 'production';

  app.use(helmet());
  app.use(compression());
  app.use(requestContextMiddleware);
  app.use(requestLoggingMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const configuredOrigins = configService.get<string>('CORS_ORIGIN');
  if (isProduction && !configuredOrigins?.trim()) {
    throw new Error('CORS_ORIGIN must be configured in production');
  }
  const corsOrigins = (configuredOrigins ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) {
    throw new Error('At least one CORS origin must be configured');
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  if (!isProduction || configService.get<string>('ENABLE_SWAGGER', 'false') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('QGOS API')
      .setDescription('QueckGrow AI Operating System - Enterprise API')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();
    SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
  }

  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);

  logger.log(`Application is running on: http://${host}:${port}`);
  if (!isProduction || configService.get<string>('ENABLE_SWAGGER', 'false') === 'true') {
    logger.log(`API documentation available at: http://${host}:${port}/api`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
