import { Fact } from '../types/fact';

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
