import { EndDate, YearMonth } from './fact';

export type CvBullet = { id: string; text: string; sourceIds: string[] };

export type CvDocument = {
  header: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    links: string[];
  };
  summary: string | null;
  skills: string[];
  experience: {
    id: string;
    company: string | null;
    title: string | null;
    location: string | null;
    startDate: YearMonth | null;
    endDate: EndDate | null;
    bullets: CvBullet[];
  }[];
  education: {
    id: string;
    institution: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: YearMonth | null;
    endDate: EndDate | null;
  }[];
  certifications: {
    id: string;
    name: string | null;
    issuer: string | null;
    issueDate: YearMonth | null;
  }[];
};

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
