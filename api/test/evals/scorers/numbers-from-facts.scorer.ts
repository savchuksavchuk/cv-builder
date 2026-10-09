import { createScorer } from 'evalite';
import { CvDocument } from '../../../src/modules/cv/domain/types/cv-document';
import { sourceValues } from '../../../src/modules/cv/domain/utils/facts/source-values';
import type { Candidate } from '../datasets/candidates';

function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));
}

export const numbersFromFacts = createScorer<Candidate, CvDocument>({
  name: 'Numbers from facts',
  description:
    'Every number in a bullet appears in the facts the bullet cites.',
  scorer: ({ input, output }) => {
    const values = sourceValues(input.facts);
    const checks = output.experience.flatMap((job) =>
      job.bullets.flatMap((bullet) => {
        const cited = bullet.sourceIds
          .map((id) => values.get(id) ?? '')
          .flatMap(numbersIn);

        return numbersIn(bullet.text).map((number) => ({
          bullet: bullet.text,
          number,
          supported: cited.includes(number),
        }));
      }),
    );

    if (!checks.length) {
      return 1;
    }

    return {
      score: checks.filter((check) => check.supported).length / checks.length,
      metadata: { invented: checks.filter((check) => !check.supported) },
    };
  },
});
