import { FactField, FactSection } from '../../types/fact';
import { Question, QuestionStatus, pathOf } from '../../types/question';
import { askableTargets } from './askable-targets';
import { connectQuestionAnswersToFacts } from './connect-question-answers-to-facts';
import { entries, first } from './fact-entries';
import { RawFact, parseExtractedFacts } from './parse-extracted-facts';
import { parseQuestionAnswers } from './parse-question-answers';
import { verifyFacts } from './verify-facts';

const raw = (
  section: FactSection,
  entry: number,
  field: FactField,
  value: string,
  quote = value,
): RawFact => ({ section, entry, field, value, quote });

const SOURCE = 'Jane Doe. Acme: Dev. Built APIs.';

const facts = parseExtractedFacts(
  [
    raw(FactSection.Contacts, 5, FactField.FullName, 'Jane Doe'),
    raw(FactSection.WorkExperience, 1, FactField.Company, 'Acme'),
    raw(FactSection.WorkExperience, 1, FactField.Company, 'Dupe'),
    raw(FactSection.WorkExperience, 1, FactField.Responsibility, 'Built APIs'),
    raw(FactSection.WorkExperience, 0, FactField.Company, 'Old'),
    raw(FactSection.WorkExperience, 0, FactField.Email, 'bad field'),
    raw(FactSection.WorkExperience, 0, FactField.Title, ' ', 'x'),
  ],
  'src',
);

const question = (
  target: Question['target'],
  status = QuestionStatus.Answered,
): Question => ({
  id: `q-${pathOf(target)}`,
  target,
  question: '?',
  status,
  answer: 'a',
  createdAt: '',
  updatedAt: '',
});

describe('parseExtractedFacts', () => {
  it('drops malformed rows, groups by entry in entry order, keeps the first scalar', () => {
    const jobs = entries(facts, FactSection.WorkExperience);

    expect(jobs.map((job) => first(job, FactField.Company))).toEqual([
      'Old',
      'Acme',
    ]);
    expect(entries(facts, FactSection.Contacts)[0].id).toBe('contacts');
    expect(facts).toHaveLength(4);
  });
});

describe('verifyFacts', () => {
  it('drops facts whose quote is not in the cited source', () => {
    const verified = verifyFacts(facts, () => SOURCE);

    expect(verified.map((f) => f.value).sort()).toEqual([
      'Acme',
      'Built APIs',
      'Jane Doe',
    ]);
  });

  const verify = (
    field: FactField,
    value: string,
    quote: string,
    section = FactSection.WorkExperience,
  ) =>
    verifyFacts(
      parseExtractedFacts([raw(section, 0, field, value, quote)], 'src'),
      () => 'Senior  Dev at Acme. Cut latency by 40%.',
    );

  it('drops a verbatim field whose value is not contained in its quote', () => {
    expect(verify(FactField.Title, 'Senior Dev', 'Dev')).toHaveLength(0);
    expect(verify(FactField.Title, 'senior dev', 'Senior  Dev')).toHaveLength(
      1,
    );
  });

  it('drops a description that adds words or numbers to its quote', () => {
    const quote = 'Cut latency';

    expect(
      verify(FactField.Achievement, 'Cut latency by 40%', quote),
    ).toHaveLength(0);
    expect(
      verify(FactField.Responsibility, 'Reduced latency', quote),
    ).toHaveLength(0);
    expect(
      verify(FactField.Achievement, 'latency by 40%', 'Cut latency by 40%'),
    ).toHaveLength(1);
  });

  it('does not compare normalized dates with their quote', () => {
    expect(verify(FactField.StartDate, '2020-01', 'Senior  Dev')).toHaveLength(
      1,
    );
  });
});

describe('parseQuestionAnswers / connectQuestionAnswersToFacts', () => {
  const job = entries(facts, FactSection.WorkExperience)[1];
  const company = question({
    section: FactSection.WorkExperience,
    entryId: job.id,
    field: FactField.Company,
  });
  const duty = question({
    section: FactSection.WorkExperience,
    entryId: job.id,
    field: FactField.Responsibility,
  });
  const newJobs = question({
    section: FactSection.WorkExperience,
    entryId: null,
    field: null,
  });
  const out = (q: Question, field: FactField, value: string, entry = 0) => ({
    questionId: q.id,
    entry,
    field,
    value,
    quote: value,
  });

  it('replaces a scalar, extends a list, adds new jobs and ignores other fields', () => {
    const merged = connectQuestionAnswersToFacts(
      facts,
      parseQuestionAnswers(
        [company, duty, newJobs],
        [
          out(company, FactField.Company, 'Acme Inc'),
          out(company, FactField.Title, 'ignored: not asked'),
          out(duty, FactField.Responsibility, 'Led team'),
          out(newJobs, FactField.Company, 'NewCo'),
          out(newJobs, FactField.Title, 'CTO'),
        ],
      ),
    );
    const jobs = entries(merged, FactSection.WorkExperience);

    expect(first(jobs[1], FactField.Company)).toBe('Acme Inc');
    expect(first(jobs[1], FactField.Title)).toBeNull();
    expect(
      jobs[1].facts.filter((f) => f.field === FactField.Responsibility),
    ).toHaveLength(2);
    expect(jobs).toHaveLength(3);
    expect(first(jobs[2], FactField.Title)).toBe('CTO');
  });
});

describe('askableTargets', () => {
  const [degree] = parseExtractedFacts(
    [raw(FactSection.Education, 0, FactField.Degree, 'MSc')],
    'src',
  );
  const ask = (field: FactField, status: QuestionStatus) =>
    question(
      { section: FactSection.Education, entryId: degree.entryId, field },
      status,
    );

  it('asks for missing jobs only when there are none', () => {
    expect(askableTargets([], []).has('work_experience')).toBe(true);
    expect(askableTargets(facts, []).has('work_experience')).toBe(false);
  });

  it('drops asked paths and whole skipped entries', () => {
    const asked = askableTargets(
      [degree],
      [ask(FactField.Degree, QuestionStatus.Answered)],
    );
    expect(asked.has(`education.${degree.entryId}.degree`)).toBe(false);
    expect(asked.has(`education.${degree.entryId}.institution`)).toBe(true);

    const skipped = askableTargets(
      [degree],
      [ask(FactField.Degree, QuestionStatus.Dismissed)],
    );
    expect([...skipped.keys()].some((k) => k.startsWith('education.'))).toBe(
      false,
    );
    expect(skipped.has('contacts.email')).toBe(true);
  });
});
