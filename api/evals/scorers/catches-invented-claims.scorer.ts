import { createScorer } from 'evalite';
import { Verdict } from '../../src/modules/cv/domain/utils/document/review-document';
import type { ValidationCase } from '../datasets/validation-cases';
import { judgedClaims } from './judged-claims';

export const catchesInventedClaims = createScorer<ValidationCase, Verdict>({
  name: 'Catches invented claims',
  description:
    'Share of the planted unsupported claims that the validator rejects.',
  scorer: ({ input, output }) => {
    const invented = judgedClaims(input, output).filter((c) => !c.supported);
    const missed = invented.filter((c) => c.judgedSupported);

    return {
      score: invented.length ? 1 - missed.length / invented.length : 1,
      metadata: { planted: invented.length, missed },
    };
  },
});
