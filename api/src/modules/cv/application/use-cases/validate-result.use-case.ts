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
import {
  Verdict,
  reviewDocument,
} from '../../domain/utils/document/review-document';
import { validateResultOutput } from '../llm/validate-result/validate-result.output';
import {
  VALIDATE_RESULT_SYSTEM,
  buildValidateResultPrompt,
} from '../llm/validate-result/validate-result.prompt';
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
    if (!cv.document) {
      throw new Error('CV has no document to validate');
    }

    const verdict = await this.judge(cv.document, cv.facts);
    const reviewed = cv.applyReview(
      reviewDocument(cv.document, verdict, cv.facts),
    );

    if (!reviewed.success) {
      throw new Error(reviewed.message);
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
    facts: Cv['facts'],
  ): Promise<Verdict> {
    const generated = await this.llm.generateObject({
      model: STEP_MODELS[CvStep.ValidateResult]!,
      effort: STEP_EFFORT[CvStep.ValidateResult],
      schema: validateResultOutput,
      system: VALIDATE_RESULT_SYSTEM,
      prompt: buildValidateResultPrompt(document, facts),
    });

    if (!generated.success || !generated.dto) {
      throw new Error(generated.message);
    }

    return generated.dto;
  }
}
