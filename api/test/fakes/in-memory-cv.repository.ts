import { Page } from '../../src/common/types/page.type';
import { Cv } from '../../src/modules/cv/domain/entities/cv.entity';
import { CvRepository } from '../../src/modules/cv/domain/repositories/cv.repository';

export class InMemoryCvRepository implements CvRepository {
  private readonly cvs = new Map<string, Cv>();

  add(cv: Cv): Cv {
    this.cvs.set(cv.id, cv);
    return cv;
  }

  findById(id: string): Promise<Cv | null> {
    return Promise.resolve(this.cvs.get(id) ?? null);
  }

  findByIdForUser(id: string, userId: string): Promise<Cv | null> {
    const cv = this.cvs.get(id);
    return Promise.resolve(cv?.userId === userId ? cv : null);
  }

  listForUser(
    userId: string,
    { offset, limit }: { offset: number; limit: number },
  ): Promise<Page<Cv>> {
    const own = [...this.cvs.values()].filter((cv) => cv.userId === userId);
    return Promise.resolve({
      items: own.slice(offset, offset + limit),
      total: own.length,
    });
  }

  save(cv: Cv): Promise<void> {
    this.cvs.set(cv.id, cv);
    return Promise.resolve();
  }
}
