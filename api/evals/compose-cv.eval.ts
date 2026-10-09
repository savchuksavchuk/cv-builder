import { evalite } from 'evalite';
import { CvDocument } from '../src/modules/cv/domain/types/cv-document';
import { faithfulness } from './scorers/faithfulness.scorer';
import { noForbiddenClaims } from './scorers/no-forbidden-claims.scorer';
import { numbersFromFacts } from './scorers/numbers-from-facts.scorer';
import { roleRelevance } from './scorers/role-relevance.scorer';
import { Candidate, candidates } from './datasets/candidates';
import { composeCv } from './tasks/compose-cv.task';

evalite<Candidate, CvDocument>('Compose CV', {
  data: () => candidates.map((candidate) => ({ input: candidate })),
  task: composeCv,
  scorers: [numbersFromFacts, noForbiddenClaims, faithfulness, roleRelevance],
  columns: ({ input, output }) => [
    { label: 'Candidate', value: input.name },
    { label: 'Target role', value: input.targetRole },
    { label: 'Summary', value: output.summary },
  ],
});
