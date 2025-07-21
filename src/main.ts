import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  app.enableCors({
    origin: [
      'https://justhalaa-web.vercel.app',
      'http://localhost:3001',
      'http://localhost:4200',
    ],
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Enable validation pipes globally
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     transform: true,
  //   }),
  // );

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) => {
        const message: Record<string, string> = {};

        errors.forEach((error) => {
          if (error.constraints) {
            message[error.property] = Object.values(error.constraints)[0];
          }
        });

        return new BadRequestException({
          success: false,
          statusCode: 400,
          message, // now this is an object not an array
          data: null,
          error: 'Bad Request',
        });
      },
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('JustHalaa API')
    .setDescription('The JustHalaa API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
