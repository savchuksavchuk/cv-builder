import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../../../shared/services/llm.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import {
  MAX_QUESTIONS_PER_ROUND,
  MAX_QUESTION_ROUNDS,
} from '../../domain/constants/cv-limits.constants';
import {
  STEP_EFFORT,
  STEP_MODELS,
} from '../../domain/constants/cv-pipeline.constants';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { QuestionDraft, allowedPaths } from '../../domain/utils/question-paths';
import { generatedQuestionsOutput } from '../llm/generate-questions.output';
import {
  GENERATE_QUESTIONS_SYSTEM,
  buildGenerateQuestionsPrompt,
} from '../llm/generate-questions.prompt';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';

@Injectable()
export class GenerateQuestionsUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly llm: LlmService,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const drafts =
      cv.questionRounds < MAX_QUESTION_ROUNDS
        ? await this.draftQuestions(cv)
        : [];

    const asked = cv.askQuestions(drafts);

    if (!asked.success) {
      throw new Error(asked.message);
    }

    await this.transaction.run(async () => {
      await this.cvs.save(cv, { flush: true });

      if (
        cv.status === CvStatus.Processing &&
        cv.currentStep &&
        cv.currentStep !== CvStep.AnswerQuestions
      ) {
        const queued = await this.jobs.enqueueStep(cv.id, cv.currentStep);

        if (!queued.success) {
          throw new Error(queued.message);
        }
      }
    });
  }

  private async draftQuestions(cv: Cv): Promise<QuestionDraft[]> {
    const paths = allowedPaths(cv);
    const asked = new Set(cv.questions.map((q) => q.path));

    const generated = await this.llm.generateObject({
      model: STEP_MODELS[CvStep.GenerateQuestions]!,
      effort: STEP_EFFORT[CvStep.GenerateQuestions],
      schema: generatedQuestionsOutput,
      system: GENERATE_QUESTIONS_SYSTEM,
      prompt: buildGenerateQuestionsPrompt(cv, paths),
    });

    if (!generated.success || !generated.dto) {
      throw new Error(generated.message);
    }

    return generated.dto.questions
      .map(({ path, question }) => ({ path, question: question.trim() }))
      .filter(
        ({ path, question }) => paths.has(path) && !asked.has(path) && question,
      )
      .slice(0, MAX_QUESTIONS_PER_ROUND);
  }
}
