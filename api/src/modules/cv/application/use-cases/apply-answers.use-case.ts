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
import { Question, QuestionStatus } from '../../domain/types/question';
import { connectQuestionAnswersToFacts } from '../../domain/utils/connect-question-answers-to-facts';
import { parseQuestionAnswers } from '../../domain/utils/parse-question-answers';
import { applyAnswersOutput } from '../llm/apply-answers.output';
import {
  APPLY_ANSWERS_SYSTEM,
  buildApplyAnswersPrompt,
} from '../llm/apply-answers.prompt';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class ApplyAnswersUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly llm: LlmService,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const answered = cv.questions.filter(
      (q) => q.status === QuestionStatus.Answered,
    );

    const facts = answered.length ? await this.extractFacts(answered) : [];

    const applied = cv.applyAnswers(
      connectQuestionAnswersToFacts(
        cv.facts,
        parseQuestionAnswers(answered, facts),
      ),
    );

    if (!applied.success) {
      throw new Error(applied.message);
    }

    const finished = cv.finishStep(CvStep.ApplyAnswers);

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

  private async extractFacts(questions: Question[]) {
    const generated = await this.llm.generateObject({
      model: STEP_MODELS[CvStep.ApplyAnswers]!,
      effort: STEP_EFFORT[CvStep.ApplyAnswers],
      schema: applyAnswersOutput,
      system: APPLY_ANSWERS_SYSTEM,
      prompt: buildApplyAnswersPrompt(questions),
    });

    if (!generated.success || !generated.dto) {
      throw new Error(generated.message);
    }

    return generated.dto.facts;
  }
}
