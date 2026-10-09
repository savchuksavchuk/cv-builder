import { createScorer } from 'evalite';
import { FactField } from '../../src/modules/cv/domain/types/fact';
import type { CvText } from '../datasets/cv-texts';
import type { Extraction } from '../tasks/extract-facts.task';

const DATE_FIELDS = [
  FactField.StartDate,
  FactField.EndDate,
  FactField.IssueDate,
];
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const datesNormalized = createScorer<CvText, Extraction>({
  name: 'Dates normalized',
  description: 'Every date is YYYY-MM, or "present" for an ongoing end date.',
  scorer: ({ output }) => {
    const dates = output.verified.filter((fact) =>
      DATE_FIELDS.includes(fact.field),
    );
    const malformed = dates.filter(
      (fact) =>
        !YEAR_MONTH.test(fact.value) &&
        !(fact.field === FactField.EndDate && fact.value === 'present'),
    );

    if (!dates.length) {
      return 1;
    }

    return {
      score: 1 - malformed.length / dates.length,
      metadata: {
        dates: dates.length,
        malformed: malformed.map(({ field, value }) => ({ field, value })),
      },
    };
  },
});
