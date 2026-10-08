import type { CvDocument } from '@cv-builder/cv-template';

export type {
  CvBullet,
  CvDocument,
  EndDate,
  YearMonth,
} from '@cv-builder/cv-template';

type WithOptionalId<T> = Omit<T, 'id'> & { id?: string };

export type CvDocumentPatch = {
  header?: CvDocument['header'];
  summary?: string | null;
  skills?: string[];
  experience?: (Omit<
    WithOptionalId<CvDocument['experience'][number]>,
    'bullets'
  > & {
    bullets: { id?: string; text: string }[];
  })[];
  education?: WithOptionalId<CvDocument['education'][number]>[];
  certifications?: WithOptionalId<CvDocument['certifications'][number]>[];
};
