import { NotFoundException } from '@nestjs/common';
import type { TransactionService } from '../../../../../../src/modules/shared/services/transaction.service';
import { CvStep } from '../../../../../../src/modules/cv/domain/types/cv-step';
import { QuestionStatus } from '../../../../../../src/modules/cv/domain/types/question';
import { FakeCvJobs } from '../../../../../fakes/fake-cv-jobs.port-implementation';
import { InMemoryCvRepository } from '../../../../../fakes/in-memory-cv.repository';
import {
  OPEN_QUESTION_ID,
  cvWaitingForAnswers,
} from '../../../../../fixtures/cv.fixture';
import { SubmitAnswersUseCase } from '../../../../../../src/modules/cv/application/use-cases/submit-answers.use-case';

// The real service pulls in the ORM, which jest cannot load; the test passes its own.
jest.mock(
  '../../../../../../src/modules/shared/services/transaction.service',
  () => ({
    TransactionService: class {},
  }),
);

describe('SubmitAnswersUseCase', () => {
  const owner = 'user-1';
  const stranger = 'user-2';
  const answers = {
    answers: [{ questionId: OPEN_QUESTION_ID, answer: 'a@b.c' }],
  };

  let cvs: InMemoryCvRepository;
  let jobs: FakeCvJobs;
  let submitAnswers: SubmitAnswersUseCase;

  beforeEach(() => {
    cvs = new InMemoryCvRepository();
    jobs = new FakeCvJobs();
    const transaction = {
      run: (work: () => Promise<void>) => work(),
    } as unknown as TransactionService;
    submitAnswers = new SubmitAnswersUseCase(cvs, jobs, transaction);
  });

  it('lets the owner answer and queues the next step', async () => {
    const cv = cvs.add(cvWaitingForAnswers(owner));

    await submitAnswers.execute(owner, cv.id, answers);

    expect(cv.questions[0].status).toBe(QuestionStatus.Answered);
    expect(jobs.enqueued).toEqual([{ cvId: cv.id, step: CvStep.ApplyAnswers }]);
  });

  it('does not let another user answer, change the CV or queue anything', async () => {
    const cv = cvs.add(cvWaitingForAnswers(owner));

    await expect(
      submitAnswers.execute(stranger, cv.id, answers),
    ).rejects.toThrow(new NotFoundException('CV not found'));

    expect(cv.questions[0].status).toBe(QuestionStatus.Open);
    expect(cv.currentStep).toBe(CvStep.AnswerQuestions);
    expect(jobs.enqueued).toEqual([]);
  });
});
