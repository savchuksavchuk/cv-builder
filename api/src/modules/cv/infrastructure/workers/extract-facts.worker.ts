import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../shared/services/queue.service';
import { AdvanceCvStepUseCase } from '../../application/use-cases/advance-cv-step.use-case';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepWorker } from './cv-step.worker';

@Injectable()
export class ExtractFactsWorker extends CvStepWorker {
  protected readonly step = CvStep.ExtractFacts;

  constructor(
    queue: QueueService,
    orm: MikroORM,
    failCv: FailCvUseCase,
    private readonly advanceStep: AdvanceCvStepUseCase,
  ) {
    super(queue, orm, failCv);
  }

  protected run(cvId: string): Promise<void> {
    return this.advanceStep.execute(cvId, this.step);
  }
}
