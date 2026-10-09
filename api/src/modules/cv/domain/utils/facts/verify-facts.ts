import { Fact, FactField } from '../../types/fact';

const collapseWhitespace = (text: string): string =>
  text.normalize('NFC').replace(/\s+/g, ' ').trim();

// Dates are normalized to YYYY-MM, so they are not copied from the quote.
const NORMALIZED_FIELDS: ReadonlySet<FactField> = new Set([
  FactField.StartDate,
  FactField.EndDate,
  FactField.IssueDate,
]);

function supportsValue(fact: Fact, quote: string): boolean {
  const value = collapseWhitespace(fact.value);

  if (NORMALIZED_FIELDS.has(fact.field)) {
    return true;
  }
  return quote.toLowerCase().includes(value.toLowerCase());
}

export function verifyFacts(
  facts: Fact[],
  resolve: (source: string) => string | null,
): Fact[] {
  return facts.filter((fact) => {
    const quote = collapseWhitespace(fact.evidence.quote);
    const source = resolve(fact.evidence.source);

    return (
      !!quote &&
      source !== null &&
      collapseWhitespace(source).includes(quote) &&
      supportsValue(fact, quote)
    );
  });
}
