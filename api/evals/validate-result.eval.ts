import { evalite } from 'evalite';
import { Verdict } from '../src/modules/cv/domain/utils/document/review-document';
import { ValidationCase, validationCases } from './datasets/validation-cases';
import { catchesInventedClaims } from './scorers/catches-invented-claims.scorer';
import { keepsFaithfulClaims } from './scorers/keeps-faithful-claims.scorer';
import { validateResult } from './tasks/validate-result.task';

evalite<ValidationCase, Verdict>('Validate result', {
  data: () => validationCases.map((testCase) => ({ input: testCase })),
  task: validateResult,
  scorers: [catchesInventedClaims, keepsFaithfulClaims],
  columns: ({ input }) => [
    { label: 'Case', value: input.name },
    { label: 'Candidate', value: input.candidate },
  ],
});
