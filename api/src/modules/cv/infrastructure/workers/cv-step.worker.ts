import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { QueueJob, QueueService } from '../../../shared/services/queue.service';
import { FailCvUseCase } from '../../application/use-cases/fail-cv.use-case';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { CvStepJobData, cvStepQueue } from '../jobs/cv-queues.constants';

export abstract class CvStepWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  protected abstract readonly step: CvStep;

  @Inject(CV_REPOSITORY) private readonly cvs: CvRepository;

  constructor(
    private readonly queue: QueueService,
    private readonly orm: MikroORM,
    private readonly failCv: FailCvUseCase,
  ) {}

  protected abstract run(cv: Cv): Promise<void>;

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
      await this.inContext(() => this.runIfCurrent(cvId));
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

  private async runIfCurrent(cvId: string): Promise<void> {
    const cv = await this.cvs.findById(cvId);

    if (!cv) {
      throw new Error(`CV ${cvId} is not visible yet`);
    }

    if (cv.status !== CvStatus.Processing) {
      return;
    }

    if (cv.currentStep !== this.step) {
      if (cv.isBeforeStep(this.step)) {
        throw new Error(`Step ${this.step} is not current yet`);
      }
      return;
    }

    const startedAt = Date.now();
    await this.run(cv);
    this.logger.log(
      `Step ${this.step} of cv ${cvId} done in ${Date.now() - startedAt}ms`,
    );
  }

  private inContext<T>(fn: () => Promise<T>): Promise<T> {
    return RequestContext.create(this.orm.em, fn);
  }
}
