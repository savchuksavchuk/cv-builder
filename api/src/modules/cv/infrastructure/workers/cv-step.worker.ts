import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { QueueJob, QueueService } from '../../../shared/services/queue.service';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepJobData, cvStepQueue } from '../jobs/cv-queues.constants';

export abstract class CvStepWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  protected abstract readonly step: CvStep;

  constructor(
    private readonly queue: QueueService,
    private readonly orm: MikroORM,
    private readonly failCv: FailCvUseCase,
  ) {}

  protected abstract run(cvId: string): Promise<void>;

  async onApplicationBootstrap(): Promise<void> {
    const name = cvStepQueue(this.step);

    await this.queue.createQueue(name, {
      maxRetries: 2,
      retryDelaySeconds: 30,
      retryBackoff: true,
      uniquePerKey: true,
    });
    await this.queue.process<CvStepJobData>(name, (job) => this.handle(job));
  }

  private async handle(job: QueueJob<CvStepJobData>): Promise<void> {
    const { cvId } = job.data;

    try {
      await this.inContext(() => this.run(cvId));
    } catch (error) {
      this.logger.error(
        `Step ${this.step} of cv ${cvId} failed (attempt ${job.attempt}/${job.maxAttempts}): ${String(error)}`,
      );

      if (job.attempt < job.maxAttempts) {
        throw error;
      }

      await this.inContext(() => this.failCv.execute(cvId));
    }
  }

  private inContext<T>(fn: () => Promise<T>): Promise<T> {
    return RequestContext.create(this.orm.em, fn);
  }
}
