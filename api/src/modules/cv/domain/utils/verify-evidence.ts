import { Certification } from '../types/certification';
import { Contacts } from '../types/contacts';
import { Education } from '../types/education';
import { Fact, FactOrigin, Item } from '../types/fact';
import { WorkExperience } from '../types/work-experience';

export type VerifiableSections = {
  contacts: Contacts | null;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
};

type ResolveSource = (source: string) => string | null;

const squash = (text: string): string =>
  text.normalize('NFC').replace(/\s+/g, ' ').trim();

function verifyFact<T extends string>(
  fact: Fact<T>,
  resolve: ResolveSource,
): Fact<T> {
  if (fact.origin !== FactOrigin.Ai || fact.value === null) {
    return fact;
  }

  const quote = fact.evidence ? squash(fact.evidence.quote) : '';
  const source = fact.evidence ? resolve(fact.evidence.source) : null;

  if (quote && source !== null && squash(source).includes(quote)) {
    return fact;
  }

  return { ...fact, value: null, evidence: null };
}

function verifyItems(
  items: Item<Fact>[],
  resolve: ResolveSource,
): Item<Fact>[] {
  return items
    .map((item) => ({ ...item, ...verifyFact(item, resolve) }))
    .filter((item) => item.value !== null);
}

export function verifySections(
  sections: VerifiableSections,
  resolve: ResolveSource,
): VerifiableSections {
  const v = <T extends string>(fact: Fact<T>) => verifyFact(fact, resolve);
  const { contacts } = sections;

  return {
    contacts: contacts && {
      fullName: v(contacts.fullName),
      email: v(contacts.email),
      phone: v(contacts.phone),
      location: v(contacts.location),
      links: verifyItems(contacts.links, resolve),
    },
    workExperience: sections.workExperience.map((job) => ({
      ...job,
      company: v(job.company),
      title: v(job.title),
      location: v(job.location),
      startDate: v(job.startDate),
      endDate: v(job.endDate),
      responsibilities: verifyItems(job.responsibilities, resolve),
      achievements: verifyItems(job.achievements, resolve),
      skills: verifyItems(job.skills, resolve),
    })),
    education: sections.education.map((item) => ({
      ...item,
      institution: v(item.institution),
      degree: v(item.degree),
      fieldOfStudy: v(item.fieldOfStudy),
      startDate: v(item.startDate),
      endDate: v(item.endDate),
    })),
    certifications: sections.certifications.map((item) => ({
      ...item,
      name: v(item.name),
      issuer: v(item.issuer),
      issueDate: v(item.issueDate),
    })),
  };
}
