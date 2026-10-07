import { Inject, Injectable } from '@nestjs/common';
import { TransactionService } from '../../../shared/services/transaction.service';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class AdvanceCvStepUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cvId: string, step: CvStep): Promise<void> {
    const cv = await this.cvs.findById(cvId);

    if (!cv) {
      throw new Error(`CV ${cvId} is not visible yet`);
    }

    if (cv.status !== CvStatus.Processing) {
      return;
    }

    if (cv.currentStep !== step) {
      if (cv.isBeforeStep(step)) {
        throw new Error(`Step ${step} is not current yet`);
      }
      return;
    }

    const finished = cv.finishStep(step);
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
