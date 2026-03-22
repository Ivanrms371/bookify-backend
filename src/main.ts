import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipe } from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(validationPipe);
  app.enableCors({
    origin: process.env.APP_URL,
    credentials: true,
  });
  const jwtAuthGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtAuthGuard);
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
