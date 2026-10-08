import { Fact, FactField } from '../types/fact';

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
