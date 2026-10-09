import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  InMemoryCvRepository,
  completedCv,
} from '../../testing/cv-fakes.testing';
import { ListCvsUseCase } from './list-cvs.use-case';

function query(page: number, limit: number): PaginationQueryDto {
  return Object.assign(new PaginationQueryDto(), { page, limit });
}

describe('ListCvsUseCase', () => {
  const owner = 'user-1';
  const stranger = 'user-2';

  let cvs: InMemoryCvRepository;
  let listCvs: ListCvsUseCase;

  beforeEach(() => {
    cvs = new InMemoryCvRepository();
    listCvs = new ListCvsUseCase(cvs);
  });

  it('lists only the CVs of the user', async () => {
    const own = [completedCv(owner), completedCv(owner)].map((cv) =>
      cvs.add(cv),
    );
    cvs.add(completedCv(stranger));

    const { items, total } = await listCvs.execute(owner, query(1, 10));

    expect(total).toBe(2);
    expect(items.map((item) => item.id).sort()).toEqual(
      own.map((cv) => cv.id).sort(),
    );
  });

  it('returns an empty list for a user without CVs', async () => {
    cvs.add(completedCv(stranger));

    const response = await listCvs.execute(owner, query(1, 10));

    expect(response).toEqual({ items: [], total: 0, page: 1, limit: 10 });
  });

  it('returns the requested page', async () => {
    [1, 2, 3].forEach(() => cvs.add(completedCv(owner)));
    cvs.add(completedCv(stranger));

    const response = await listCvs.execute(owner, query(2, 2));

    expect(response.items).toHaveLength(1);
    expect(response.total).toBe(3);
    expect(response.page).toBe(2);
  });

  it('does not expose the document or the facts in the list', async () => {
    cvs.add(completedCv(owner));

    const { items } = await listCvs.execute(owner, query(1, 10));

    expect(Object.keys(items[0]).sort()).toEqual([
      'createdAt',
      'currentStep',
      'failureReason',
      'id',
      'status',
      'targetRole',
      'updatedAt',
    ]);
  });
});
