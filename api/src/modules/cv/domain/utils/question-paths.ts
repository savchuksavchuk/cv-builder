import { Cv } from '../entities/cv.entity';

export type QuestionDraft = { path: string; question: string };

type Sections = Pick<
  Cv,
  'contacts' | 'workExperience' | 'education' | 'certifications'
>;

const CONTACT_FIELDS = ['fullName', 'email', 'phone', 'location'];
const JOB_FIELDS = [
  'company',
  'title',
  'location',
  'startDate',
  'endDate',
  'responsibilities',
  'achievements',
  'skills',
];
const EDUCATION_FIELDS = [
  'institution',
  'degree',
  'fieldOfStudy',
  'startDate',
  'endDate',
];
const CERTIFICATION_FIELDS = ['name', 'issuer', 'issueDate'];

export function allowedPaths(cv: Sections): Set<string> {
  const paths = new Set<string>();

  if (!cv.workExperience.length) {
    paths.add('workExperience');
  }

  CONTACT_FIELDS.forEach((field) => paths.add(`contacts.${field}`));
  cv.workExperience.forEach((job) =>
    JOB_FIELDS.forEach((field) =>
      paths.add(`workExperience.${job.id}.${field}`),
    ),
  );
  cv.education.forEach((item) =>
    EDUCATION_FIELDS.forEach((field) =>
      paths.add(`education.${item.id}.${field}`),
    ),
  );
  cv.certifications.forEach((item) =>
    CERTIFICATION_FIELDS.forEach((field) =>
      paths.add(`certifications.${item.id}.${field}`),
    ),
  );

  return paths;
}
