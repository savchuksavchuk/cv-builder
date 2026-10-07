import { Injectable } from '@nestjs/common';
import { Result } from '../../../../common/classes/result.class';
import { QueueService } from '../../../shared/services/queue.service';
import { CvJobsPort } from '../../application/ports/cv-jobs.port';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepJobData, cvStepQueue } from '../jobs/cv-queues.constants';

@Injectable()
export class CvJobsPortImplementation implements CvJobsPort {
  constructor(private readonly queue: QueueService) {}

  enqueueStep(cvId: string, step: CvStep): Promise<Result> {
    const data: CvStepJobData = { cvId };
    return this.queue.enqueue(cvStepQueue(step), data, cvId);
  }
}
