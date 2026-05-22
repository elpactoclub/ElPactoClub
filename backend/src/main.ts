import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — allow frontend dev server
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL ?? '',
    ],
    credentials: true,
  });

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

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🏀 El Pacto API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at   http://localhost:${port}/api/docs`);
}
bootstrap();
