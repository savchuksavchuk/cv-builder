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
import { INITIAL_USER_INPUT_SOURCE } from '../../domain/types/fact';
import { parseFacts } from '../../domain/utils/facts';
import { wrapUntrusted } from '../../domain/utils/untrusted';
import { EXTRACT_FACTS_SYSTEM } from '../llm/extract-facts.prompt';
import { extractedFactsOutput } from '../llm/extracted-facts.output';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class ExtractFactsUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly llm: LlmService,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const step = CvStep.ExtractFacts;

    const generated = await this.llm.generateObject({
      model: STEP_MODELS[step]!,
      effort: STEP_EFFORT[step],
      schema: extractedFactsOutput,
      system: EXTRACT_FACTS_SYSTEM,
      prompt: wrapUntrusted(
        'document',
        INITIAL_USER_INPUT_SOURCE,
        cv.initialUserInput,
      ),
    });

    if (!generated.success || !generated.dto) {
      throw new Error(generated.message);
    }

    const applied = cv.applyExtractedFacts(
      parseFacts(generated.dto.facts, INITIAL_USER_INPUT_SOURCE),
    );

    if (!applied.success) {
      throw new Error(applied.message);
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
