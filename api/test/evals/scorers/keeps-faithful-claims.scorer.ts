import { createScorer } from 'evalite';
import { Verdict } from '../../../src/modules/cv/domain/utils/document/review-document';
import type { ValidationCase } from '../datasets/validation-cases';
import { judgedClaims } from './judged-claims';

export const keepsFaithfulClaims = createScorer<ValidationCase, Verdict>({
  name: 'Keeps faithful claims',
  description:
    'Share of the truly supported claims that the validator does not reject.',
  scorer: ({ input, output }) => {
    const faithful = judgedClaims(input, output).filter((c) => c.supported);
    const rejected = faithful.filter((c) => !c.judgedSupported);

    return {
      score: faithful.length ? 1 - rejected.length / faithful.length : 1,
      metadata: { faithful: faithful.length, wronglyRejected: rejected },
    };
  },
});
