import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../../../../../../src/modules/cv/domain/types/fact';
import { connectQuestionAnswersToFacts } from '../../../../../../../src/modules/cv/domain/utils/facts/connect-question-answers-to-facts';

function jobFact(
  id: string,
  entryId: string,
  field: FactField,
  value: string,
  source = INITIAL_USER_INPUT_SOURCE,
): Fact {
  return {
    id,
    section: FactSection.WorkExperience,
    entryId,
    field,
    value,
    evidence: { source, quote: value },
  };
}

describe('connectQuestionAnswersToFacts', () => {
  const company = jobFact('f1', 'job-1', FactField.Company, 'Acme');
  const title = jobFact('f2', 'job-1', FactField.Title, 'Dev');
  const duty = jobFact('f3', 'job-1', FactField.Responsibility, 'built APIs');
  const otherJobCompany = jobFact('f4', 'job-2', FactField.Company, 'Globex');

  it('replaces the value of a single-value field in place', () => {
    const facts = [company, title, otherJobCompany];
    const answer = jobFact('a1', 'job-1', FactField.Company, 'Acme Inc', 'q1');

    const connected = connectQuestionAnswersToFacts(facts, [answer]);

    expect(connected).toEqual([answer, title, otherJobCompany]);
  });

  it('adds a single-value field the entry did not have', () => {
    const facts = [company];
    const answer = jobFact('a1', 'job-1', FactField.Title, 'CTO', 'q1');

    const connected = connectQuestionAnswersToFacts(facts, [answer]);

    expect(connected).toEqual([company, answer]);
  });

  it('adds a value to a multi-value field and keeps the old ones', () => {
    const facts = [company, duty];
    const answer = jobFact(
      'a1',
      'job-1',
      FactField.Responsibility,
      'led a team',
      'q1',
    );

    const connected = connectQuestionAnswersToFacts(facts, [answer]);

    expect(connected).toEqual([company, duty, answer]);
  });

  it('adds the facts of a new entry without touching the others', () => {
    const facts = [company, otherJobCompany];
    const answer = jobFact('a1', 'job-3', FactField.Company, 'NewCo', 'q1');

    const connected = connectQuestionAnswersToFacts(facts, [answer]);

    expect(connected).toEqual([company, otherJobCompany, answer]);
  });

  it('replaces the field only in the entry of the answer', () => {
    const facts = [company, otherJobCompany];
    const answer = jobFact(
      'a1',
      'job-2',
      FactField.Company,
      'Globex Inc',
      'q1',
    );

    const connected = connectQuestionAnswersToFacts(facts, [answer]);

    expect(connected).toEqual([company, answer]);
  });

  it('applies several answers one after another', () => {
    const facts = [company];
    const answers = [
      jobFact('a1', 'job-1', FactField.Company, 'Acme Inc', 'q1'),
      jobFact('a2', 'job-1', FactField.Title, 'CTO', 'q1'),
    ];

    const connected = connectQuestionAnswersToFacts(facts, answers);

    expect(connected.map((f) => f.value)).toEqual(['Acme Inc', 'CTO']);
  });

  it('returns the facts unchanged when there are no answers', () => {
    const facts = [company, title];

    expect(connectQuestionAnswersToFacts(facts, [])).toEqual(facts);
  });

  it('does not change the given facts', () => {
    const facts = [company];
    const answer = jobFact('a1', 'job-1', FactField.Company, 'Acme Inc', 'q1');

    connectQuestionAnswersToFacts(facts, [answer]);

    expect(facts).toEqual([company]);
  });
});
