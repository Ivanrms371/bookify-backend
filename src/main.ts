import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipe } from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { corsOptions } from './config/cors.config';

const allowedOrigins = [process.env.APP_URL].filter(Boolean) as string[];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(validationPipe);
  app.enableCors(corsOptions);
  const jwtAuthGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtAuthGuard);
  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
