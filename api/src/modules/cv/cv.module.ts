import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SessionModule } from '../auth/session.module';
import { PDF_TEXT_PORT } from './application/ports/pdf-text.port';
import { InitCvUseCase } from './application/use-cases/init-cv.use-case';
import { CV_REPOSITORY } from './domain/repositories/cv.repository';
import { cvSchema } from './infrastructure/models/cv.schema';
import { PdfTextPortImplementation } from './infrastructure/ports/pdf-text.port-implementation';
import { MikroOrmCvRepository } from './infrastructure/repositories/mikro-orm-cv.repository';
import { CvController } from './interfaces/controllers/cv.controller';

@Module({
  imports: [MikroOrmModule.forFeature([cvSchema]), SessionModule],
  controllers: [CvController],
  providers: [
    InitCvUseCase,
    { provide: CV_REPOSITORY, useClass: MikroOrmCvRepository },
    { provide: PDF_TEXT_PORT, useClass: PdfTextPortImplementation },
  ],
})
export class CvModule {}
