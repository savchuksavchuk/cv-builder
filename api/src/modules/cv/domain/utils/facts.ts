import { randomUUID } from 'node:crypto';
import {
  CONTACTS_ENTRY,
  Fact,
  FactField,
  FactSection,
  LIST_FIELDS,
  SECTION_FIELDS,
} from '../types/fact';
import {
  Question,
  QuestionStatus,
  QuestionTarget,
  pathOf,
} from '../types/question';

export type AnswerRow = Omit<RawFact, 'section'> & { questionId: string };

export type RawFact = {
  section: FactSection;
  entry: number;
  field: FactField;
  value: string;
  quote: string;
};

export function parseFacts(
  rows: RawFact[],
  source: string,
  entryId?: string,
): Fact[] {
  const newIds = new Map<string, string>();

  return rows
    .filter(
      (row) =>
        row.value.trim() &&
        row.quote.trim() &&
        row.entry >= 0 &&
        SECTION_FIELDS[row.section].includes(row.field),
    )
    .sort((a, b) => a.entry - b.entry)
    .map((row) => {
      const key = `${row.section}:${row.entry}`;
      const id =
        entryId ??
        (row.section === FactSection.Contacts
          ? CONTACTS_ENTRY
          : (newIds.get(key) ?? randomUUID()));
      newIds.set(key, id);

      return {
        id: randomUUID(),
        section: row.section,
        entryId: id,
        field: row.field,
        value: row.value.trim(),
        evidence: { source, quote: row.quote.trim() },
      };
    });
}

const sameSlot = (a: Fact, b: Fact): boolean =>
  a.entryId === b.entryId && a.field === b.field;

export function addFacts(facts: Fact[], incoming: Fact[]): Fact[] {
  const batch = incoming.filter(
    (fact, i) =>
      LIST_FIELDS.has(fact.field) ||
      incoming.findIndex((other) => sameSlot(other, fact)) === i,
  );

  return batch.reduce((acc, fact) => {
    const old = acc.findIndex((f) => sameSlot(f, fact));

    return LIST_FIELDS.has(fact.field) || old < 0
      ? [...acc, fact]
      : acc.with(old, fact);
  }, facts);
}

const squash = (text: string): string =>
  text.normalize('NFC').replace(/\s+/g, ' ').trim();

export function verifyFacts(
  facts: Fact[],
  resolve: (source: string) => string | null,
): Fact[] {
  return facts.filter((fact) => {
    const quote = squash(fact.evidence.quote);
    const source = resolve(fact.evidence.source);

    return !!quote && source !== null && squash(source).includes(quote);
  });
}

export type Entry = { id: string; facts: Fact[] };

export function entries(facts: Fact[], section: FactSection): Entry[] {
  const byId = new Map<string, Fact[]>();

  for (const fact of facts) {
    if (fact.section === section) {
      byId.set(fact.entryId, [...(byId.get(fact.entryId) ?? []), fact]);
    }
  }

  return [...byId].map(([id, own]) => ({ id, facts: own }));
}

export const all = (entry: Entry | undefined, field: FactField): Fact[] =>
  entry?.facts.filter((fact) => fact.field === field) ?? [];

export const first = (
  entry: Entry | undefined,
  field: FactField,
): string | null => all(entry, field)[0]?.value ?? null;

export function sourceValues(facts: Fact[]): Map<string, string> {
  const citable = [
    FactField.Responsibility,
    FactField.Achievement,
    FactField.Skill,
  ];

  return new Map(
    facts
      .filter((fact) => citable.includes(fact.field))
      .map((fact) => [fact.id, fact.value]),
  );
}

export function askableTargets(
  facts: Fact[],
  questions: Question[],
): Map<string, QuestionTarget> {
  const asked = new Set(questions.map((q) => pathOf(q.target)));
  const skipped = new Set(
    questions
      .filter((q) => q.status === QuestionStatus.Dismissed)
      .map((q) => q.target.entryId),
  );
  const targets: QuestionTarget[] = [];

  if (!entries(facts, FactSection.WorkExperience).length) {
    targets.push({
      section: FactSection.WorkExperience,
      entryId: null,
      field: null,
    });
  }

  for (const section of Object.values(FactSection)) {
    const ids =
      section === FactSection.Contacts
        ? [CONTACTS_ENTRY]
        : entries(facts, section).map((entry) => entry.id);

    for (const entryId of ids) {
      for (const field of SECTION_FIELDS[section]) {
        targets.push({ section, entryId, field });
      }
    }
  }

  return new Map(
    targets
      .filter(
        (target) =>
          !asked.has(pathOf(target)) &&
          (target.section === FactSection.Contacts ||
            !skipped.has(target.entryId)),
      )
      .map((target) => [pathOf(target), target]),
  );
}

export function mergeAnswerFacts(
  facts: Fact[],
  questions: Question[],
  rows: AnswerRow[],
): Fact[] {
  return questions.reduce((merged, { id, target }) => {
    const own = rows
      .filter(
        (row) =>
          row.questionId === id &&
          (target.field === null || row.field === target.field),
      )
      .map((row) => ({ ...row, section: target.section }));

    return addFacts(merged, parseFacts(own, id, target.entryId ?? undefined));
  }, facts);
}
