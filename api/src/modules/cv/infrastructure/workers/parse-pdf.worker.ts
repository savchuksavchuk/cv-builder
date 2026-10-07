import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../shared/services/queue.service';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { ParsePdfUseCase } from '../../application/use-cases/parse-pdf.use-case';
import { Cv } from '../../domain/entities/cv.entity';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepWorker } from './cv-step.worker';

@Injectable()
export class ParsePdfWorker extends CvStepWorker {
  protected readonly step = CvStep.ParsePdf;

  constructor(
    queue: QueueService,
    orm: MikroORM,
    failCv: FailCvUseCase,
    private readonly parsePdf: ParsePdfUseCase,
  ) {
    super(queue, orm, failCv);
  }

  protected run(cv: Cv): Promise<void> {
    return this.parsePdf.execute(cv);
  }
}
