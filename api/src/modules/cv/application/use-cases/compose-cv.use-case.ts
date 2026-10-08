import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../../../shared/services/llm.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import {
  STEP_EFFORT,
  STEP_MODELS,
} from '../../domain/constants/cv-pipeline.constants';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { buildDocument } from '../../domain/utils/document/build-document';
import { composeCvOutput } from '../llm/compose-cv/compose-cv.output';
import {
  COMPOSE_CV_SYSTEM,
  buildComposeCvPrompt,
} from '../llm/compose-cv/compose-cv.prompt';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class ComposeCvUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly llm: LlmService,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const generated = await this.llm.generateObject({
      model: STEP_MODELS[CvStep.ComposeCv]!,
      effort: STEP_EFFORT[CvStep.ComposeCv],
      schema: composeCvOutput,
      system: COMPOSE_CV_SYSTEM,
      prompt: buildComposeCvPrompt(cv),
    });

    if (!generated.success || !generated.dto) {
      throw new Error(generated.message);
    }

    const applied = cv.applyComposition(buildDocument(cv.facts, generated.dto));
    if (!applied.success) {
      throw new Error(applied.message);
    }

    const finished = cv.finishStep(CvStep.ComposeCv);
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
