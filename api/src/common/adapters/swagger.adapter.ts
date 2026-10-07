import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SwaggerConfig = {
  title: 'API',
  description: 'API Documentation',
  version: '1.0',
  tag: 'cv-builder',
  path: 'docs',
};

export const InitSwaggerAdapter = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle(SwaggerConfig.title)
    .setDescription(SwaggerConfig.description)
    .setVersion(SwaggerConfig.version)
    .addTag(SwaggerConfig.tag)
    .addCookieAuth('sid', undefined, 'session')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SwaggerConfig.path, app, document);
};
