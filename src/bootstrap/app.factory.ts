import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Express } from 'express';
import { AppModule } from '../app.module';

export async function createHttpApplication() {
  const app = await NestFactory.create(AppModule);

  return configureApplication(app);
}

export async function createServerlessApplication() {
  const expressApp: Express = express();

  expressApp.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  await configureApplication(app);

  return { app, expressApp };
}

async function configureApplication(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove properties that do not have any decorators
      whitelist: true,
      // Automatically transform payloads to DTO instances
      transform: true,
      // Throw an error if non-whitelisted properties are present
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Bookly API')
    .setDescription('The Bookly API documentation')
    .setVersion('1.0')
    .addTag('Bookly')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document);

  await app.init();

  return app;
}
