import { randomUUID } from 'node:crypto';
import { MAX_BULLET_CHARS } from '../constants/cv-limits.constants';
import { CvBullet, CvDocument } from '../types/cv-document';
import { VerifiableSections } from './verify-evidence';

export type Composition = {
  summary: string;
  skillIds: string[];
  jobOrder: string[];
  bullets: { jobId: string; text: string; sourceIds: string[] }[];
};

export function sourceValues(
  sections: VerifiableSections,
): Map<string, string> {
  const values = new Map<string, string>();

  for (const job of sections.workExperience) {
    for (const item of [
      ...job.responsibilities,
      ...job.achievements,
      ...job.skills,
    ]) {
      if (item.value) {
        values.set(item.id, item.value);
      }
    }
  }

  return values;
}

type Job = VerifiableSections['workExperience'][number];

export function buildDocument(
  sections: VerifiableSections,
  composition: Composition,
): CvDocument {
  return {
    header: buildHeader(sections.contacts),
    summary: composition.summary.trim() || null,
    skills: buildSkills(sections.workExperience, composition.skillIds),
    experience: buildExperience(sections.workExperience, composition),
    education: sections.education.map((item) => ({
      id: item.id,
      institution: item.institution.value,
      degree: item.degree.value,
      fieldOfStudy: item.fieldOfStudy.value,
      startDate: item.startDate.value,
      endDate: item.endDate.value,
    })),
    certifications: sections.certifications.map((item) => ({
      id: item.id,
      name: item.name.value,
      issuer: item.issuer.value,
      issueDate: item.issueDate.value,
    })),
  };
}

function buildHeader(contacts: VerifiableSections['contacts']) {
  return {
    fullName: contacts?.fullName.value ?? null,
    email: contacts?.email.value ?? null,
    phone: contacts?.phone.value ?? null,
    location: contacts?.location.value ?? null,
    links: (contacts?.links ?? [])
      .map((link) => link.value)
      .filter((value): value is string => !!value),
  };
}

function buildSkills(jobs: Job[], skillIds: string[]): string[] {
  const skills = new Map(
    jobs.flatMap((job) => job.skills.map((skill) => [skill.id, skill.value])),
  );
  const values = skillIds
    .map((id) => skills.get(id))
    .filter((value): value is string => !!value);

  return [...new Set(values)];
}

function buildExperience(jobs: Job[], composition: Composition) {
  return sortByOrder(jobs, composition.jobOrder).map((job) => ({
    id: job.id,
    company: job.company.value,
    title: job.title.value,
    location: job.location.value,
    startDate: job.startDate.value,
    endDate: job.endDate.value,
    bullets: buildBullets(job, composition.bullets),
  }));
}

function sortByOrder<T extends { id: string }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const listed = orderedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is T => !!item);

  return [...new Set([...listed, ...items])];
}

function factsOf(job: Job) {
  return [...job.responsibilities, ...job.achievements].filter(
    (item) => item.value,
  );
}

function buildBullets(job: Job, drafts: Composition['bullets']): CvBullet[] {
  const ownIds = new Set(factsOf(job).map((fact) => fact.id));

  const bullets = drafts
    .filter((draft) => draft.jobId === job.id)
    .map((draft) => ({
      id: randomUUID(),
      text: draft.text.trim(),
      sourceIds: draft.sourceIds.filter((id) => ownIds.has(id)),
    }))
    .filter(
      (bullet) =>
        bullet.text &&
        bullet.text.length <= MAX_BULLET_CHARS &&
        bullet.sourceIds.length,
    );

  return bullets.length ? bullets : bulletsFromFacts(job);
}

function bulletsFromFacts(job: Job): CvBullet[] {
  return factsOf(job).map((fact) => ({
    id: randomUUID(),
    text: fact.value!,
    sourceIds: [fact.id],
  }));
}
