import { Fact, FactField, FactSection } from '../types/fact';

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
