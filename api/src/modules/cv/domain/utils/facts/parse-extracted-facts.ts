import { randomUUID } from 'node:crypto';
import {
  FIXED_ENTRIES,
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
  MULTI_VALUE_FIELDS,
  SECTION_FIELDS,
} from '../../types/fact';

export type RawFact = {
  section: FactSection;
  entry: number;
  field: FactField;
  value: string;
  quote: string;
};

export function parseExtractedFacts(
  rows: RawFact[],
  source: string = INITIAL_USER_INPUT_SOURCE,
  entryId?: string,
): Fact[] {
  const newIds = new Map<string, string>();
  const seenSingleValueSlots = new Set<string>();

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
        FIXED_ENTRIES[row.section] ??
        newIds.get(key) ??
        randomUUID();
      newIds.set(key, id);

      return {
        id: randomUUID(),
        section: row.section,
        entryId: id,
        field: row.field,
        value: row.value.trim(),
        evidence: { source, quote: row.quote.trim() },
      };
    })
    .filter((fact) => {
      const slot = `${fact.entryId}:${fact.field}`;

      if (MULTI_VALUE_FIELDS.has(fact.field)) {
        return true;
      }
      if (seenSingleValueSlots.has(slot)) {
        return false;
      }
      seenSingleValueSlots.add(slot);

      return true;
    });
}
