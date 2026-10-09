import { ApplyAnswersUseCase } from '../../../src/modules/cv/application/use-cases/apply-answers.use-case';
import { Cv } from '../../../src/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '../../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../../src/modules/cv/domain/types/cv-step';
import { Fact } from '../../../src/modules/cv/domain/types/fact';
import { QuestionStatus } from '../../../src/modules/cv/domain/types/question';
import { candidates } from '../datasets/candidates';
import type { AnswerCase } from '../datasets/answer-cases';
import { FakeCvJobs } from '../../fakes/fake-cv-jobs.port-implementation';
import { InMemoryCvRepository } from '../../fakes/in-memory-cv.repository';
import { runWithoutTransaction } from '../../fakes/run-without-transaction';
import { productLlm } from './product-llm';

export type Applied = { before: Fact[]; after: Fact[] };

export async function applyAnswers(testCase: AnswerCase): Promise<Applied> {
  const candidate = candidates.find((c) => c.name === testCase.candidate);

  if (!candidate) {
    throw new Error(`There is no candidate named ${testCase.candidate}`);
  }

  const cv = Cv.create('eval-user', candidate.targetRole, 'eval input', null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.ApplyAnswers;
  cv.facts = candidate.facts.filter(
    (f) => !testCase.dropFactIds.includes(f.id),
  );
  cv.questions = testCase.questions.map(
    ({ question, answer, ...target }, i) => ({
      id: `q${i + 1}`,
      target,
      question,
      status: QuestionStatus.Answered,
      answer,
      createdAt: '',
      updatedAt: '',
    }),
  );

  const before = [...cv.facts];

  await new ApplyAnswersUseCase(
    new InMemoryCvRepository(),
    new FakeCvJobs(),
    productLlm(),
    runWithoutTransaction,
  ).execute(cv);

  return { before, after: cv.facts };
}
