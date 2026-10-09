import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../types/fact';
import { verifyFacts } from './verify-facts';

const cvText = 'Senior  Dev at Acme. Cut latency by 40%.';
const answerText = 'I was the CTO there.';

function factOf(
  field: FactField,
  value: string,
  quote: string,
  source = INITIAL_USER_INPUT_SOURCE,
): Fact {
  return {
    id: 'fact-1',
    section: FactSection.WorkExperience,
    entryId: 'job-1',
    field,
    value,
    evidence: { source, quote },
  };
}

// The CV text and one answered question. Every other source is unknown.
function resolveSource(source: string): string | null {
  if (source === INITIAL_USER_INPUT_SOURCE) {
    return cvText;
  }
  if (source === 'question-1') {
    return answerText;
  }
  return null;
}

describe('verifyFacts', () => {
  describe('quote', () => {
    it('keeps a fact whose quote is in its source', () => {
      const fact = factOf(FactField.Company, 'Acme', 'Acme');

      expect(verifyFacts([fact], resolveSource)).toEqual([fact]);
    });

    it('drops a fact whose quote is not in its source', () => {
      const fact = factOf(FactField.Company, 'Globex', 'Globex');

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('drops a fact with an empty quote', () => {
      const fact = factOf(FactField.Company, 'Acme', '   ');

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('ignores repeated whitespace when looking for the quote', () => {
      const fact = factOf(FactField.Title, 'Senior Dev', 'Senior Dev');

      expect(verifyFacts([fact], resolveSource)).toEqual([fact]);
    });
  });

  describe('source', () => {
    it('drops a fact that cites an unknown source', () => {
      const fact = factOf(FactField.Company, 'Acme', 'Acme', 'question-2');

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('checks the quote against the cited source only', () => {
      // "Acme" is in the CV text, but this fact claims it comes from the answer.
      const fact = factOf(FactField.Company, 'Acme', 'Acme', 'question-1');

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('keeps a fact quoted from an answer', () => {
      const fact = factOf(FactField.Title, 'CTO', 'CTO', 'question-1');

      expect(verifyFacts([fact], resolveSource)).toEqual([fact]);
    });
  });

  describe('value', () => {
    it('drops a fact whose value is not contained in its quote', () => {
      const fact = factOf(FactField.Title, 'Senior Dev', 'Dev');

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('compares the value with the quote ignoring case', () => {
      const fact = factOf(FactField.Title, 'senior dev', 'Senior  Dev');

      expect(verifyFacts([fact], resolveSource)).toEqual([fact]);
    });

    it('drops an achievement that adds a number to its quote', () => {
      const fact = factOf(
        FactField.Achievement,
        'Cut latency by 40%',
        'Cut latency',
      );

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('drops a responsibility that rephrases its quote', () => {
      const fact = factOf(
        FactField.Responsibility,
        'Reduced latency',
        'Cut latency',
      );

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });

    it('keeps a value that is a part of a longer quote', () => {
      const fact = factOf(
        FactField.Achievement,
        'latency by 40%',
        'Cut latency by 40%',
      );

      expect(verifyFacts([fact], resolveSource)).toEqual([fact]);
    });

    it('does not compare normalized dates with their quote', () => {
      const fact = factOf(FactField.StartDate, '2020-01', 'Senior  Dev');

      expect(verifyFacts([fact], resolveSource)).toEqual([fact]);
    });

    it('still requires the quote of a date to be in its source', () => {
      const fact = factOf(FactField.StartDate, '2020-01', 'January 2020');

      expect(verifyFacts([fact], resolveSource)).toEqual([]);
    });
  });

  it('keeps the supported facts and drops the rest', () => {
    const supported = factOf(FactField.Company, 'Acme', 'Acme');
    const invented = factOf(FactField.Title, 'CEO', 'CEO');

    expect(verifyFacts([supported, invented], resolveSource)).toEqual([
      supported,
    ]);
  });
});
