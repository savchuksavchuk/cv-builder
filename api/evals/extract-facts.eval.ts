import { evalite } from 'evalite';
import { CvText, cvTexts } from './datasets/cv-texts';
import { datesNormalized } from './scorers/dates-normalized.scorer';
import { groundedFacts } from './scorers/grounded-facts.scorer';
import { keyFactsFound } from './scorers/key-facts-found.scorer';
import { noUnwantedFacts } from './scorers/no-unwanted-facts.scorer';
import { Extraction, extractFacts } from './tasks/extract-facts.task';

evalite<CvText, Extraction>('Extract facts', {
  data: () => cvTexts.map((cvText) => ({ input: cvText })),
  task: extractFacts,
  scorers: [groundedFacts, keyFactsFound, datesNormalized, noUnwantedFacts],
  columns: ({ input, output }) => [
    { label: 'Text', value: input.name },
    {
      label: 'Facts',
      value: `${output.verified.length} of ${output.extracted.length} kept`,
    },
  ],
});
