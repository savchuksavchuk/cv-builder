import { FactField, FactSection } from '../../types/fact';
import { Question, QuestionStatus, QuestionTarget } from '../../types/question';
import { AnswerRow, parseQuestionAnswers } from './parse-question-answers';

function questionAbout(id: string, target: QuestionTarget): Question {
  return {
    id,
    target,
    question: '?',
    status: QuestionStatus.Answered,
    answer: 'an answer',
    createdAt: '',
    updatedAt: '',
  };
}

function answerRow(
  questionId: string,
  field: FactField,
  value: string,
  entry = 0,
): AnswerRow {
  return { questionId, entry, field, value, quote: value };
}

const jobFieldQuestion = questionAbout('q1', {
  section: FactSection.WorkExperience,
  entryId: 'job-1',
  field: FactField.Company,
});

const educationEntryQuestion = questionAbout('q2', {
  section: FactSection.Education,
  entryId: 'edu-1',
  field: null,
});

const missingJobsQuestion = questionAbout('q3', {
  section: FactSection.WorkExperience,
  entryId: null,
  field: null,
});

describe('parseQuestionAnswers', () => {
  it('attaches the facts to the entry and section the question was about', () => {
    const rows = [answerRow('q1', FactField.Company, 'Acme')];

    const [fact] = parseQuestionAnswers([jobFieldQuestion], rows);

    expect(fact.entryId).toBe('job-1');
    expect(fact.section).toBe(FactSection.WorkExperience);
  });

  it('cites the question as the source of the fact', () => {
    const rows = [answerRow('q1', FactField.Company, 'Acme')];

    const [fact] = parseQuestionAnswers([jobFieldQuestion], rows);

    expect(fact.evidence.source).toBe('q1');
  });

  it('ignores rows of a question that was not asked', () => {
    const rows = [answerRow('unknown', FactField.Company, 'Acme')];

    expect(parseQuestionAnswers([jobFieldQuestion], rows)).toEqual([]);
  });

  it('ignores other fields when the question was about one field', () => {
    const rows = [
      answerRow('q1', FactField.Company, 'Acme'),
      answerRow('q1', FactField.Title, 'CTO'),
    ];

    const facts = parseQuestionAnswers([jobFieldQuestion], rows);

    expect(facts.map((f) => f.field)).toEqual([FactField.Company]);
  });

  it('accepts several fields when the question was about a whole entry', () => {
    const rows = [
      answerRow('q2', FactField.Institution, 'MIT'),
      answerRow('q2', FactField.EndDate, '2016-06'),
    ];

    const facts = parseQuestionAnswers([educationEntryQuestion], rows);

    expect(facts.map((f) => f.field)).toEqual([
      FactField.Institution,
      FactField.EndDate,
    ]);
  });

  it('ignores fields that do not belong to the section of the question', () => {
    const rows = [
      answerRow('q2', FactField.Institution, 'MIT'),
      answerRow('q2', FactField.Company, 'Acme'),
    ];

    const facts = parseQuestionAnswers([educationEntryQuestion], rows);

    expect(facts.map((f) => f.field)).toEqual([FactField.Institution]);
  });

  it('keeps the answers of different questions apart', () => {
    const rows = [
      answerRow('q1', FactField.Company, 'Acme'),
      answerRow('q2', FactField.Institution, 'MIT'),
    ];

    const facts = parseQuestionAnswers(
      [jobFieldQuestion, educationEntryQuestion],
      rows,
    );

    expect(facts.map((f) => [f.evidence.source, f.entryId])).toEqual([
      ['q1', 'job-1'],
      ['q2', 'edu-1'],
    ]);
  });

  describe('question about missing jobs', () => {
    it('creates one new job per entry index', () => {
      const rows = [
        answerRow('q3', FactField.Company, 'Acme', 0),
        answerRow('q3', FactField.Title, 'CTO', 0),
        answerRow('q3', FactField.Company, 'Globex', 1),
      ];

      const [acme, cto, globex] = parseQuestionAnswers(
        [missingJobsQuestion],
        rows,
      );

      expect(acme.entryId).toBe(cto.entryId);
      expect(acme.entryId).not.toBe(globex.entryId);
    });

    it('does not reuse the id of an existing job', () => {
      const rows = [answerRow('q3', FactField.Company, 'Acme')];

      const [fact] = parseQuestionAnswers([missingJobsQuestion], rows);

      expect(fact.section).toBe(FactSection.WorkExperience);
      expect(fact.entryId).not.toBe('job-1');
    });
  });
});
