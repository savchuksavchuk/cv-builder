import { Inject, Injectable } from '@nestjs/common';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class VerifyEvidenceUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const verified = cv.verifyEvidence();

    if (!verified.success) {
      throw new Error(verified.message);
    }

    const finished = cv.finishStep(CvStep.VerifyEvidence);

    if (!finished.success) {
      throw new Error(finished.message);
    }

    await this.transaction.run(async () => {
      await this.cvs.save(cv, { flush: true });

      if (cv.status === CvStatus.Processing && cv.currentStep) {
        const queued = await this.jobs.enqueueStep(cv.id, cv.currentStep);
        if (!queued.success) {
          throw new Error(queued.message);
        }
      }
    });
  }
}
