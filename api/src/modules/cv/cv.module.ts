import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CV_REPOSITORY } from './domain/repositories/cv.repository';
import { cvSchema } from './infrastructure/models/cv.schema';
import { MikroOrmCvRepository } from './infrastructure/repositories/mikro-orm-cv.repository';

@Module({
  imports: [MikroOrmModule.forFeature([cvSchema])],
  providers: [{ provide: CV_REPOSITORY, useClass: MikroOrmCvRepository }],
  exports: [CV_REPOSITORY],
})
export class CvModule {}
