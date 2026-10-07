import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../shared/services/queue.service';
import { ApplyAnswersUseCase } from '../../application/use-cases/apply-answers.use-case';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { Cv } from '../../domain/entities/cv.entity';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepWorker } from './cv-step.worker';

@Injectable()
export class ApplyAnswersWorker extends CvStepWorker {
  protected readonly step = CvStep.ApplyAnswers;

  constructor(
    queue: QueueService,
    orm: MikroORM,
    failCv: FailCvUseCase,
    private readonly applyAnswers: ApplyAnswersUseCase,
  ) {
    super(queue, orm, failCv);
  }

  protected run(cv: Cv): Promise<void> {
    return this.applyAnswers.execute(cv);
  }
}
