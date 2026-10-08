import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../shared/services/queue.service';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { ValidateResultUseCase } from '../../application/use-cases/validate-result.use-case';
import { Cv } from '../../domain/entities/cv.entity';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepWorker } from './cv-step.worker';

@Injectable()
export class ValidateResultWorker extends CvStepWorker {
  protected readonly step = CvStep.ValidateResult;

  constructor(
    queue: QueueService,
    orm: MikroORM,
    failCv: FailCvUseCase,
    private readonly validateResult: ValidateResultUseCase,
  ) {
    super(queue, orm, failCv);
  }

  protected run(cv: Cv): Promise<void> {
    return this.validateResult.execute(cv);
  }
}
