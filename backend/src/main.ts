// EN: Application entry point — bootstraps the NestJS app (security, CORS, validation, Swagger, WebSockets) and starts the HTTP server.
// ES: Punto de entrada de la aplicación — arranca la app NestJS (seguridad, CORS, validación, Swagger, WebSockets) e inicia el servidor HTTP.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './common/throttler-exception.filter';
import { join } from 'path';
import * as express from 'express';

// EN: Bootstraps and configures the Nest application, then listens on the configured port.
// ES: Arranca y configura la aplicación Nest, y luego escucha en el puerto configurado.
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Security headers (HSTS, CSP, X-Frame-Options, etc.)
  app.use(
    helmet({
      // CSP off por ahora: el frontend es una app separada; Swagger UI necesita inline scripts.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Ocultar la cabecera que revela el stack tecnológico
  app.disable('x-powered-by');

  // Límite de tamaño del body — bloquea payloads abusivos (imágenes base64 incluidas).
  // NestFactory.create({ rawBody: true }) preserva req.rawBody para la firma del webhook de Stripe.
  app.useBodyParser('json', { limit: '8mb' });
  app.useBodyParser('urlencoded', { limit: '8mb', extended: true });

  // Dev only: serve files saved to disk by the local fallback in TigrisService
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — allow frontend dev server and production
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://elpactoclub-frontend.fly.dev',
      'https://elpactoclub.com',
      'https://www.elpactoclub.com',
      process.env.FRONTEND_URL ?? '',
    ].filter(Boolean),
    credentials: true,
  });

  // Custom error messages for rate limiting
  app.useGlobalFilters(new ThrottlerExceptionFilter());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('El Pacto BC API')
    .setDescription('Fan app API — gamification, events, community, auth')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🏀 El Pacto API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at   http://localhost:${port}/api/docs`);
}
bootstrap();
