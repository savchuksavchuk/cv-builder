import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

export const getAllowedOrigins = (configService: ConfigService): string[] => [
  configService.getOrThrow<string>('CLIENT_DOMAIN'),
  'http://localhost:3000',
];

export const SecurityAdapter = (
  app: NestExpressApplication,
  configService: ConfigService,
): void => {
  app.enableCors({
    origin: getAllowedOrigins(configService),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(helmet());

  app.set('trust proxy', 'loopback');

  app.use(cookieParser());
};
