import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../shared/services/queue.service';
import { ComposeCvUseCase } from '../../application/use-cases/compose-cv.use-case';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { Cv } from '../../domain/entities/cv.entity';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepWorker } from './cv-step.worker';

@Injectable()
export class ComposeCvWorker extends CvStepWorker {
  protected readonly step = CvStep.ComposeCv;

  constructor(
    queue: QueueService,
    orm: MikroORM,
    failCv: FailCvUseCase,
    private readonly composeCv: ComposeCvUseCase,
  ) {
    super(queue, orm, failCv);
  }

  protected run(cv: Cv): Promise<void> {
    return this.composeCv.execute(cv);
  }
}
