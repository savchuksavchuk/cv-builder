import { ConflictException, NotFoundException } from '@nestjs/common';
import { InMemoryCvRepository } from '../../../../../fakes/in-memory-cv.repository';
import { completedCv } from '../../../../../fixtures/cv.fixture';
import { UpdateCvUseCase } from '../../../../../../src/modules/cv/application/use-cases/update-cv.use-case';

describe('UpdateCvUseCase', () => {
  const owner = 'user-1';
  const stranger = 'user-2';

  let cvs: InMemoryCvRepository;
  let updateCv: UpdateCvUseCase;

  beforeEach(() => {
    cvs = new InMemoryCvRepository();
    updateCv = new UpdateCvUseCase(cvs);
  });

  it('lets the owner edit the CV', async () => {
    const cv = cvs.add(completedCv(owner));

    await updateCv.execute(owner, cv.id, {
      version: cv.version,
      summary: 'New summary',
    });

    expect(cv.document?.summary).toBe('New summary');
  });

  it('does not let another user edit the CV', async () => {
    const cv = cvs.add(completedCv(owner));

    await expect(
      updateCv.execute(stranger, cv.id, {
        version: cv.version,
        summary: 'Hijacked',
      }),
    ).rejects.toThrow(new NotFoundException('CV not found'));

    expect(cv.document?.summary).toBe('Original summary');
  });

  it('rejects an edit based on an old version', async () => {
    const cv = cvs.add(completedCv(owner));

    await expect(
      updateCv.execute(owner, cv.id, {
        version: cv.version + 1,
        summary: 'Stale edit',
      }),
    ).rejects.toThrow(ConflictException);

    expect(cv.document?.summary).toBe('Original summary');
  });
});
