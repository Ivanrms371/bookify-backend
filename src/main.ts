import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipe } from './config/configuration';
import { corsOptions } from './config/cors.config';

const allowedOrigins = [process.env.APP_URL].filter(Boolean) as string[];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(validationPipe);
  app.enableCors(corsOptions);
  await app.listen(process.env.BACKEND_PORT ?? 4000, '0.0.0.0');
}
bootstrap();
