import { Page } from '../../../../common/types/page.type';
import { SaveOptions } from '../../../../common/types/save-options.type';
import { Cv } from '../entities/cv.entity';

export interface CvRepository {
  findById(id: string): Promise<Cv | null>;
  findByIdForUser(id: string, userId: string): Promise<Cv | null>;
  listForUser(
    userId: string,
    options: { offset: number; limit: number },
  ): Promise<Page<Cv>>;
  save(cv: Cv, options?: SaveOptions): Promise<void>;
}

export const CV_REPOSITORY = Symbol('CV_REPOSITORY');
