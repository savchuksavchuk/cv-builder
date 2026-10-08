import { randomUUID } from 'node:crypto';
import { MAX_BULLET_CHARS } from '../constants/cv-limits.constants';
import { CvBullet, CvDocument } from '../types/cv-document';
import { Fact, FactField as F, FactSection } from '../types/fact';
import { Entry, all, entries, first } from './fact-entries';

export type Composition = {
  summary: string;
  skillIds: string[];
  jobOrder: string[];
  bullets: { jobId: string; text: string; sourceIds: string[] }[];
};

export function buildDocument(
  facts: Fact[],
  composition: Composition,
): CvDocument {
  const contacts = entries(facts, FactSection.Contacts)[0];
  const jobs = entries(facts, FactSection.WorkExperience);

  return {
    header: {
      fullName: first(contacts, F.FullName),
      email: first(contacts, F.Email),
      phone: first(contacts, F.Phone),
      location: first(contacts, F.Location),
      links: all(contacts, F.Link).map((link) => link.value),
    },
    summary: composition.summary.trim() || null,
    skills: buildSkills(facts, composition.skillIds),
    experience: sortByOrder(jobs, composition.jobOrder).map((job) => ({
      id: job.id,
      company: first(job, F.Company),
      title: first(job, F.Title),
      location: first(job, F.Location),
      startDate: first(job, F.StartDate),
      endDate: first(job, F.EndDate),
      bullets: buildBullets(job, composition.bullets),
    })),
    education: entries(facts, FactSection.Education).map((item) => ({
      id: item.id,
      institution: first(item, F.Institution),
      degree: first(item, F.Degree),
      fieldOfStudy: first(item, F.FieldOfStudy),
      startDate: first(item, F.StartDate),
      endDate: first(item, F.EndDate),
    })),
    certifications: entries(facts, FactSection.Certification).map((item) => ({
      id: item.id,
      name: first(item, F.Name),
      issuer: first(item, F.Issuer),
      issueDate: first(item, F.IssueDate),
    })),
  };
}

function buildSkills(facts: Fact[], skillIds: string[]): string[] {
  const skills = new Map(
    facts.filter((f) => f.field === F.Skill).map((f) => [f.id, f.value]),
  );
  const values = skillIds
    .map((id) => skills.get(id))
    .filter((value): value is string => !!value);

  return [...new Set(values)];
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

function factsOf(job: Entry): Fact[] {
  return [...all(job, F.Responsibility), ...all(job, F.Achievement)];
}

function buildBullets(job: Entry, drafts: Composition['bullets']): CvBullet[] {
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

function bulletsFromFacts(job: Entry): CvBullet[] {
  return factsOf(job).map((fact) => ({
    id: randomUUID(),
    text: fact.value,
    sourceIds: [fact.id],
  }));
}
