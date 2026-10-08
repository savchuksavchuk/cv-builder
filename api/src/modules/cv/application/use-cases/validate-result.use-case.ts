import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../../../shared/services/llm.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import { MAX_COMPOSE_REGENERATIONS } from '../../domain/constants/cv-limits.constants';
import {
  STEP_EFFORT,
  STEP_MODELS,
} from '../../domain/constants/cv-pipeline.constants';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { sourceValues } from '../../domain/utils/facts';
import {
  Verdict,
  reviewDocument,
  sanitizeDocument,
} from '../../domain/utils/review-document';
import { validateResultOutput } from '../llm/validate-result.output';
import {
  VALIDATE_RESULT_SYSTEM,
  buildValidateResultPrompt,
} from '../llm/validate-result.prompt';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class ValidateResultUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly llm: LlmService,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const document = cv.document;

    if (!document) {
      throw new Error('CV has no document to validate');
    }

    const values = sourceValues(cv.facts);

    const verdict = await this.judge(document, values);

    const review = reviewDocument(document, verdict);
    const rejected = review.rejectedBullets.size > 0 || review.summaryRejected;

    if (rejected && cv.composeRegenerations < MAX_COMPOSE_REGENERATIONS) {
      const result = cv.rejectComposition(review.feedback);
      if (!result.success) {
        throw new Error(result.message);
      }
    } else {
      const applied = cv.applyValidation(
        rejected ? sanitizeDocument(document, review, values) : document,
      );
      if (!applied.success) {
        throw new Error(applied.message);
      }

      const finished = cv.finishStep(CvStep.ValidateResult);
      if (!finished.success) {
        throw new Error(finished.message);
      }
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

  private async judge(
    document: NonNullable<Cv['document']>,
    values: Map<string, string>,
  ): Promise<Verdict> {
    const generated = await this.llm.generateObject({
      model: STEP_MODELS[CvStep.ValidateResult]!,
      effort: STEP_EFFORT[CvStep.ValidateResult],
      schema: validateResultOutput,
      system: VALIDATE_RESULT_SYSTEM,
      prompt: buildValidateResultPrompt(document, values),
    });

    if (!generated.success || !generated.dto) {
      throw new Error(generated.message);
    }

    return generated.dto;
  }
}
