import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../shared/services/queue.service';
import { VerifyEvidenceUseCase } from '../../application/use-cases/verify-evidence.use-case';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { Cv } from '../../domain/entities/cv.entity';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepWorker } from './cv-step.worker';

@Injectable()
export class VerifyEvidenceWorker extends CvStepWorker {
  protected readonly step = CvStep.VerifyEvidence;

  constructor(
    queue: QueueService,
    orm: MikroORM,
    failCv: FailCvUseCase,
    private readonly verifyEvidence: VerifyEvidenceUseCase,
  ) {
    super(queue, orm, failCv);
  }

  protected run(cv: Cv): Promise<void> {
    return this.verifyEvidence.execute(cv);
  }
}
