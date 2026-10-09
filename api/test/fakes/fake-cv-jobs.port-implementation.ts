import { Result, ResultBuilder } from '../../src/common/classes/result.class';
import { CvJobsPort } from '../../src/modules/cv/application/ports/cv-jobs.port';
import { CvStep } from '../../src/modules/cv/domain/types/cv-step';

export class FakeCvJobs implements CvJobsPort {
  readonly enqueued: { cvId: string; step: CvStep }[] = [];

  enqueueStep(cvId: string, step: CvStep): Promise<Result> {
    this.enqueued.push({ cvId, step });
    return Promise.resolve(new ResultBuilder().setSuccess(true).build());
  }
}
