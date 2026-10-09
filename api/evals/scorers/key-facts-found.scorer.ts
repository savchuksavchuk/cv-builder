import { createScorer } from 'evalite';
import type { CvText } from '../datasets/cv-texts';
import type { Extraction } from '../tasks/extract-facts.task';

function normalized(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

export const keyFactsFound = createScorer<CvText, Extraction>({
  name: 'Key facts found',
  description:
    'Share of the key facts of the text (names, titles, numbers, skills) that survive as facts.',
  scorer: ({ input, output }) => {
    const kept = output.verified.map((fact) => normalized(fact.value));
    const missing = input.mustFind.filter(
      (key) => !kept.some((value) => value.includes(normalized(key))),
    );

    return {
      score: 1 - missing.length / input.mustFind.length,
      metadata: { expected: input.mustFind.length, missing },
    };
  },
});
