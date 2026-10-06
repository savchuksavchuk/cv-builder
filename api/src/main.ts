import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SecurityAdapter } from './common/adapters/cors.adapter';
import { InitSwaggerAdapter } from './common/adapters/swagger.adapter';
import { ValidationAdapter } from './common/adapters/validation.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  SecurityAdapter(app, configService);
  ValidationAdapter(app);
  InitSwaggerAdapter(app);

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log(`Server is running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
