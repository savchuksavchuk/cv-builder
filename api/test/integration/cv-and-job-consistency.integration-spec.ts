import { RequestContext } from '@mikro-orm/core';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { InitCvUseCase } from '../../src/modules/cv/application/use-cases/init-cv.use-case';
import { SubmitAnswersUseCase } from '../../src/modules/cv/application/use-cases/submit-answers.use-case';
import { Cv } from '../../src/modules/cv/domain/entities/cv.entity';
import { CvRepository } from '../../src/modules/cv/domain/repositories/cv.repository';
import { CvStatus } from '../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../src/modules/cv/domain/types/cv-step';
import { CvJobsPortImplementation } from '../../src/modules/cv/infrastructure/ports/cv-jobs.port-implementation';
import { MikroOrmCvRepository } from '../../src/modules/cv/infrastructure/repositories/mikro-orm-cv.repository';
import { InMemoryFileStorage } from '../fakes/in-memory-file-storage.port-implementation';
import { OPEN_QUESTION_ID, cvWaitingForAnswers } from '../fixtures/cv.fixture';
import { TransactionService } from '../../src/modules/shared/services/transaction.service';
import { TestDatabase, startTestDatabase } from './database/test-database';

describe('CV and its job in the queue', () => {
  let db: TestDatabase;
  let cvs: MikroOrmCvRepository;
  let transaction: TransactionService;
  let jobs: CvJobsPortImplementation;
  let initCv: InitCvUseCase;
  let submitAnswers: SubmitAnswersUseCase;

  // Like the HTTP middleware and the workers: every action gets its own EntityManager context.
  const inRequest = <T>(work: () => Promise<T>): Promise<T> =>
    RequestContext.create(db.orm.em, work);

  beforeAll(async () => {
    db = await startTestDatabase();
    cvs = new MikroOrmCvRepository(db.orm.em);
    transaction = new TransactionService(db.orm.em);
    jobs = new CvJobsPortImplementation(db.queue);
    initCv = new InitCvUseCase(
      cvs,
      jobs,
      new InMemoryFileStorage(),
      transaction,
    );
    submitAnswers = new SubmitAnswersUseCase(cvs, jobs, transaction);
  });

  afterAll(() => db.stop());

  beforeEach(async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    await db.reset();
  });

  async function savedCvWaitingForAnswers(): Promise<Cv> {
    const userId = await db.createUser();
    const cv = cvWaitingForAnswers(userId);
    await inRequest(() => cvs.save(cv, { flush: true }));
    return cv;
  }

  const answers = {
    answers: [{ questionId: OPEN_QUESTION_ID, answer: 'a@b.c' }],
  };

  it('saves a new CV together with the job that starts its generation', async () => {
    await db.createStepQueue(CvStep.ExtractFacts);
    const userId = await db.createUser();

    const created = await inRequest(() =>
      initCv.execute(userId, {
        targetRole: 'Backend Engineer',
        text: 'Jane Doe, backend developer',
      }),
    );

    const row = await db.cvRow(created.id);
    expect(row?.status).toBe(CvStatus.Processing);
    expect(row?.current_step).toBe(CvStep.ExtractFacts);

    const queued = await db.jobsIn('cv.extract_facts');
    expect(queued).toHaveLength(1);
    expect(queued[0].data).toEqual({ cvId: created.id });
    expect(queued[0].singleton_key).toBe(created.id);
  });

  it('does not create a CV when its job cannot be queued', async () => {
    const userId = await db.createUser();

    await expect(
      inRequest(() =>
        initCv.execute(userId, {
          targetRole: 'Backend Engineer',
          text: 'Jane Doe, backend developer',
        }),
      ),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(await db.cvRows()).toEqual([]);
    expect(await db.jobsIn('cv.extract_facts')).toEqual([]);
  });

  it('does not move a CV forward when the job for the next step cannot be queued', async () => {
    const cv = await savedCvWaitingForAnswers();

    await expect(
      inRequest(() => submitAnswers.execute(cv.userId, cv.id, answers)),
    ).rejects.toThrow(ServiceUnavailableException);

    const row = await db.cvRow(cv.id);
    expect(row?.current_step).toBe(CvStep.AnswerQuestions);
    expect(row?.questions[0].status).toBe('open');
    expect(await db.jobsIn('cv.apply_answers')).toEqual([]);
  });

  it('takes the job back when something fails after it was queued', async () => {
    await db.createStepQueue(CvStep.ApplyAnswers);
    const userId = await db.createUser();
    const cv = Cv.create(userId, 'Backend Engineer', 'text', null);

    await expect(
      inRequest(() =>
        transaction.run(async () => {
          await cvs.save(cv, { flush: true });
          await jobs.enqueueStep(cv.id, CvStep.ApplyAnswers);
          throw new Error('failed after queueing');
        }),
      ),
    ).rejects.toThrow('failed after queueing');

    expect(await db.cvRow(cv.id)).toBeUndefined();
    expect(await db.jobsIn('cv.apply_answers')).toEqual([]);
  });

  it('queues no job when the CV was changed by someone else meanwhile', async () => {
    await db.createStepQueue(CvStep.ApplyAnswers);
    const cv = await savedCvWaitingForAnswers();

    // The CV is read, then changed in the database before the answers are saved.
    const racing: CvRepository = {
      findById: (id) => cvs.findById(id),
      listForUser: (userId, options) => cvs.listForUser(userId, options),
      save: (saved, options) => cvs.save(saved, options),
      findByIdForUser: async (id, userId) => {
        const found = await cvs.findByIdForUser(id, userId);
        await db.orm.em
          .getConnection()
          .execute('update cvs set version = version + 1 where id = ?', [id]);
        return found;
      },
    };
    const racingSubmit = new SubmitAnswersUseCase(racing, jobs, transaction);

    await expect(
      inRequest(() => racingSubmit.execute(cv.userId, cv.id, answers)),
    ).rejects.toThrow();

    const row = await db.cvRow(cv.id);
    expect(row?.current_step).toBe(CvStep.AnswerQuestions);
    expect(row?.questions[0].status).toBe('open');
    expect(await db.jobsIn('cv.apply_answers')).toEqual([]);
  });
});
