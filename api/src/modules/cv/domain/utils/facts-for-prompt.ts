import { Fact, FactSection, LIST_FIELDS, SECTION_FIELDS } from '../types/fact';
import { all, entries } from './facts';

export function factsForPrompt(facts: Fact[]): string {
  const view = Object.values(FactSection).map((section) => [
    section,
    entries(facts, section).map((entry) => ({
      id: entry.id,
      ...Object.fromEntries(
        SECTION_FIELDS[section].flatMap((field) => {
          const own = all(entry, field);

          if (!own.length) {
            return [];
          }
          return [
            [
              field,
              LIST_FIELDS.has(field)
                ? own.map((fact) => ({ id: fact.id, text: fact.value }))
                : own[0].value,
            ],
          ];
        }),
      ),
    })),
  ]);

  return JSON.stringify(Object.fromEntries(view), null, 2);
}
