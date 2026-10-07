import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Certification } from '../../domain/types/certification';
import { Contacts } from '../../domain/types/contacts';
import { Education } from '../../domain/types/education';
import {
  Fact,
  FactOrigin,
  INITIAL_USER_INPUT_SOURCE,
  Item,
} from '../../domain/types/fact';
import { WorkExperience } from '../../domain/types/work-experience';

export enum FactSection {
  Contacts = 'contacts',
  WorkExperience = 'work_experience',
  Education = 'education',
  Certification = 'certification',
}

export enum FactField {
  FullName = 'full_name',
  Email = 'email',
  Phone = 'phone',
  Location = 'location',
  Link = 'link',
  Company = 'company',
  Title = 'title',
  StartDate = 'start_date',
  EndDate = 'end_date',
  Responsibility = 'responsibility',
  Achievement = 'achievement',
  Skill = 'skill',
  Institution = 'institution',
  Degree = 'degree',
  FieldOfStudy = 'field_of_study',
  Name = 'name',
  Issuer = 'issuer',
  IssueDate = 'issue_date',
}

export const SECTION_FIELDS: Record<FactSection, FactField[]> = {
  [FactSection.Contacts]: [
    FactField.FullName,
    FactField.Email,
    FactField.Phone,
    FactField.Location,
    FactField.Link,
  ],
  [FactSection.WorkExperience]: [
    FactField.Company,
    FactField.Title,
    FactField.Location,
    FactField.StartDate,
    FactField.EndDate,
    FactField.Responsibility,
    FactField.Achievement,
    FactField.Skill,
  ],
  [FactSection.Education]: [
    FactField.Institution,
    FactField.Degree,
    FactField.FieldOfStudy,
    FactField.StartDate,
    FactField.EndDate,
  ],
  [FactSection.Certification]: [
    FactField.Name,
    FactField.Issuer,
    FactField.IssueDate,
  ],
};

export const extractedFactsOutput = z.object({
  facts: z.array(
    z.object({
      section: z.enum(FactSection).describe('CV section the fact belongs to'),
      entry: z
        .number()
        .int()
        .describe(
          '0-based index of the job / education / certification the fact belongs to, in source order. Always 0 for contacts',
        ),
      field: z
        .enum(FactField)
        .describe('Field of the section; must be valid for that section'),
      value: z.string().describe('The fact itself, as stated in the source'),
      quote: z
        .string()
        .describe('Verbatim fragment of the source that supports the value'),
    }),
  ),
});

type ExtractedFact = z.infer<typeof extractedFactsOutput>['facts'][number];

export type CvSections = {
  contacts: Contacts;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
};

type Entry = Map<FactField, ExtractedFact[]>;

export type RawFact = { value: string; quote: string };

export const toFact = <T extends string = string>(
  raw: RawFact | undefined,
  source: string = INITIAL_USER_INPUT_SOURCE,
): Fact<T> => ({
  value: (raw?.value.trim() || null) as T | null,
  evidence: raw?.quote.trim() ? { source, quote: raw.quote.trim() } : null,
  origin: FactOrigin.Ai,
});

export const toItems = (
  raws: RawFact[] = [],
  source: string = INITIAL_USER_INPUT_SOURCE,
): Item<Fact>[] =>
  raws.map((raw) => ({ id: randomUUID(), ...toFact(raw, source) }));

function groupEntries(facts: ExtractedFact[], section: FactSection): Entry[] {
  const byEntry = new Map<number, Entry>();

  for (const fact of facts) {
    if (
      fact.section !== section ||
      fact.entry < 0 ||
      !fact.value.trim() ||
      !SECTION_FIELDS[section].includes(fact.field)
    ) {
      continue;
    }

    const entry: Entry =
      byEntry.get(fact.entry) ?? new Map<FactField, ExtractedFact[]>();
    entry.set(fact.field, [...(entry.get(fact.field) ?? []), fact]);
    byEntry.set(fact.entry, entry);
  }

  return [...byEntry.entries()].sort(([a], [b]) => a - b).map(([, e]) => e);
}

export function toCvSections(
  output: z.infer<typeof extractedFactsOutput>,
  source: string = INITIAL_USER_INPUT_SOURCE,
): CvSections {
  const { facts } = output;
  const first = (entry: Entry, field: FactField) =>
    toFact(entry.get(field)?.[0], source);
  const all = (entry: Entry, field: FactField) =>
    toItems(entry.get(field), source);
  const [contacts = new Map<FactField, ExtractedFact[]>()] = groupEntries(
    facts.map((fact) => ({ ...fact, entry: 0 })),
    FactSection.Contacts,
  );

  return {
    contacts: {
      fullName: first(contacts, FactField.FullName),
      email: first(contacts, FactField.Email),
      phone: first(contacts, FactField.Phone),
      location: first(contacts, FactField.Location),
      links: all(contacts, FactField.Link),
    },
    workExperience: groupEntries(facts, FactSection.WorkExperience).map(
      (job) => ({
        id: randomUUID(),
        company: first(job, FactField.Company),
        title: first(job, FactField.Title),
        location: first(job, FactField.Location),
        startDate: first(job, FactField.StartDate),
        endDate: first(job, FactField.EndDate),
        responsibilities: all(job, FactField.Responsibility),
        achievements: all(job, FactField.Achievement),
        skills: all(job, FactField.Skill),
      }),
    ),
    education: groupEntries(facts, FactSection.Education).map((item) => ({
      id: randomUUID(),
      institution: first(item, FactField.Institution),
      degree: first(item, FactField.Degree),
      fieldOfStudy: first(item, FactField.FieldOfStudy),
      startDate: first(item, FactField.StartDate),
      endDate: first(item, FactField.EndDate),
    })),
    certifications: groupEntries(facts, FactSection.Certification).map(
      (item) => ({
        id: randomUUID(),
        name: first(item, FactField.Name),
        issuer: first(item, FactField.Issuer),
        issueDate: first(item, FactField.IssueDate),
      }),
    ),
  };
}
