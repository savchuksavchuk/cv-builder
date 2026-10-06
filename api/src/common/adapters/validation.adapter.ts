import { INestApplication, ValidationPipe } from '@nestjs/common';

export const ValidationAdapter = (app: INestApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
};
