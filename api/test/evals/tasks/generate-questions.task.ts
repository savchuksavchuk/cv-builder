import { GenerateQuestionsUseCase } from '../../../src/modules/cv/application/use-cases/generate-questions.use-case';
import { Cv } from '../../../src/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '../../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../../src/modules/cv/domain/types/cv-step';
import { pathOf } from '../../../src/modules/cv/domain/types/question';
import { candidates } from '../datasets/candidates';
import type { QuestionCase } from '../datasets/question-cases';
import { FakeCvJobs } from '../../fakes/fake-cv-jobs.port-implementation';
import { InMemoryCvRepository } from '../../fakes/in-memory-cv.repository';
import { runWithoutTransaction } from '../../fakes/run-without-transaction';
import { productLlm } from './product-llm';

export type AskedQuestions = { path: string; question: string }[];

export async function generateQuestions(
  testCase: QuestionCase,
): Promise<AskedQuestions> {
  const candidate = candidates.find((c) => c.name === testCase.candidate);

  if (!candidate) {
    throw new Error(`There is no candidate named ${testCase.candidate}`);
  }

  const cv = Cv.create('eval-user', candidate.targetRole, 'eval input', null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.GenerateQuestions;
  cv.facts = candidate.facts.filter(
    (f) => !testCase.dropFactIds.includes(f.id),
  );

  await new GenerateQuestionsUseCase(
    new InMemoryCvRepository(),
    new FakeCvJobs(),
    productLlm(),
    runWithoutTransaction,
  ).execute(cv);

  return cv.questions.map((q) => ({
    path: pathOf(q.target),
    question: q.question,
  }));
}
