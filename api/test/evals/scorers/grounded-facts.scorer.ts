import { createScorer } from 'evalite';
import type { CvText } from '../datasets/cv-texts';
import type { Extraction } from '../tasks/extract-facts.task';

export const groundedFacts = createScorer<CvText, Extraction>({
  name: 'Grounded facts',
  description:
    'Share of the extracted facts that are really in the text: the code drops the rest.',
  scorer: ({ output }) => {
    const { extracted, verified } = output;
    const keptIds = new Set(verified.map((fact) => fact.id));
    const dropped = extracted
      .filter((fact) => !keptIds.has(fact.id))
      .map(({ field, value, evidence }) => ({
        field,
        value,
        quote: evidence.quote,
      }));

    if (!extracted.length) {
      return { score: 0, metadata: { problem: 'No facts were extracted' } };
    }

    return {
      score: verified.length / extracted.length,
      metadata: { extracted: extracted.length, dropped },
    };
  },
});
