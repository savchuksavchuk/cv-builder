import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import {
  InMemoryCvRepository,
  completedCv,
} from '../../testing/cv-fakes.testing';
import { GetCvUseCase } from './get-cv.use-case';

describe('GetCvUseCase', () => {
  const owner = 'user-1';
  const stranger = 'user-2';

  let cvs: InMemoryCvRepository;
  let getCv: GetCvUseCase;

  beforeEach(() => {
    cvs = new InMemoryCvRepository();
    getCv = new GetCvUseCase(cvs);
  });

  it('returns the CV to its owner', async () => {
    const cv = cvs.add(completedCv(owner));

    const response = await getCv.execute(owner, cv.id);

    expect(response.id).toBe(cv.id);
  });

  it('does not return the CV of another user', async () => {
    const cv = cvs.add(completedCv(owner));

    await expect(getCv.execute(stranger, cv.id)).rejects.toThrow(
      new NotFoundException('CV not found'),
    );
  });

  it('answers a CV that does not exist the same way, so ids cannot be probed', async () => {
    await expect(getCv.execute(owner, randomUUID())).rejects.toThrow(
      new NotFoundException('CV not found'),
    );
  });
});
