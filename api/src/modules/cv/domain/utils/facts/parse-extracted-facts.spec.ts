import {
  CONTACTS_ENTRY,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
  SKILLS_ENTRY,
} from '../../types/fact';
import { RawFact, parseExtractedFacts } from './parse-extracted-facts';

function rawFact(
  section: FactSection,
  entry: number,
  field: FactField,
  value: string,
  quote = value,
): RawFact {
  return { section, entry, field, value, quote };
}

describe('parseExtractedFacts', () => {
  describe('malformed rows', () => {
    it('drops a row with a blank value', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Title, '  ', 'x'),
      ];

      expect(parseExtractedFacts(rows)).toEqual([]);
    });

    it('drops a row with a blank quote', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Title, 'CTO', '  '),
      ];

      expect(parseExtractedFacts(rows)).toEqual([]);
    });

    it('drops a row with a negative entry index', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, -1, FactField.Title, 'CTO'),
      ];

      expect(parseExtractedFacts(rows)).toEqual([]);
    });

    it('drops a row whose field does not belong to its section', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Email, 'a@b.c'),
        rawFact(FactSection.Education, 0, FactField.Company, 'Acme'),
      ];

      expect(parseExtractedFacts(rows)).toEqual([]);
    });
  });

  describe('fact content', () => {
    it('trims the value and the quote', () => {
      const rows = [
        rawFact(
          FactSection.WorkExperience,
          0,
          FactField.Title,
          ' CTO ',
          ' I was CTO ',
        ),
      ];

      const [fact] = parseExtractedFacts(rows);

      expect(fact.value).toBe('CTO');
      expect(fact.evidence.quote).toBe('I was CTO');
    });

    it('cites the initial user input by default', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Title, 'CTO'),
      ];

      const [fact] = parseExtractedFacts(rows);

      expect(fact.evidence.source).toBe(INITIAL_USER_INPUT_SOURCE);
    });

    it('cites the given source and puts every fact into the given entry', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Title, 'CTO'),
        rawFact(FactSection.WorkExperience, 1, FactField.Company, 'Acme'),
      ];

      const facts = parseExtractedFacts(rows, 'question-1', 'job-9');

      expect(facts.map((f) => f.evidence.source)).toEqual([
        'question-1',
        'question-1',
      ]);
      expect(facts.map((f) => f.entryId)).toEqual(['job-9', 'job-9']);
    });

    it('gives every fact its own id', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Title, 'CTO'),
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Acme'),
      ];

      const [first, second] = parseExtractedFacts(rows);

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('entries', () => {
    it('puts rows with the same entry index into one entry', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Title, 'CTO'),
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Acme'),
      ];

      const [title, company] = parseExtractedFacts(rows);

      expect(title.entryId).toBe(company.entryId);
    });

    it('puts rows with different entry indexes into different entries', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Acme'),
        rawFact(FactSection.WorkExperience, 1, FactField.Company, 'Globex'),
      ];

      const [acme, globex] = parseExtractedFacts(rows);

      expect(acme.entryId).not.toBe(globex.entryId);
    });

    it('does not mix the same entry index of different sections', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Acme'),
        rawFact(FactSection.Education, 0, FactField.Institution, 'MIT'),
      ];

      const [job, education] = parseExtractedFacts(rows);

      expect(job.entryId).not.toBe(education.entryId);
    });

    it('orders the facts by entry index', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 1, FactField.Company, 'Second'),
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'First'),
      ];

      const facts = parseExtractedFacts(rows);

      expect(facts.map((f) => f.value)).toEqual(['First', 'Second']);
    });

    it('puts contacts into one fixed entry', () => {
      const rows = [
        rawFact(FactSection.Contacts, 0, FactField.FullName, 'Jane Doe'),
        rawFact(FactSection.Contacts, 5, FactField.Email, 'jane@x.io'),
      ];

      const facts = parseExtractedFacts(rows);

      expect(facts.map((f) => f.entryId)).toEqual([
        CONTACTS_ENTRY,
        CONTACTS_ENTRY,
      ]);
    });

    it('puts skills into one fixed entry', () => {
      const rows = [
        rawFact(FactSection.Skills, 0, FactField.Skill, 'Go'),
        rawFact(FactSection.Skills, 3, FactField.Skill, 'SQL'),
      ];

      const facts = parseExtractedFacts(rows);

      expect(facts.map((f) => f.entryId)).toEqual([SKILLS_ENTRY, SKILLS_ENTRY]);
    });
  });

  describe('repeated fields', () => {
    it('keeps only the first value of a single-value field', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Acme'),
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Duplicate'),
      ];

      const facts = parseExtractedFacts(rows);

      expect(facts.map((f) => f.value)).toEqual(['Acme']);
    });

    it('keeps the same single-value field of another entry', () => {
      const rows = [
        rawFact(FactSection.WorkExperience, 0, FactField.Company, 'Acme'),
        rawFact(FactSection.WorkExperience, 1, FactField.Company, 'Globex'),
      ];

      const facts = parseExtractedFacts(rows);

      expect(facts.map((f) => f.value)).toEqual(['Acme', 'Globex']);
    });

    it('keeps every value of a multi-value field', () => {
      const rows = [
        rawFact(
          FactSection.WorkExperience,
          0,
          FactField.Responsibility,
          'built APIs',
        ),
        rawFact(
          FactSection.WorkExperience,
          0,
          FactField.Responsibility,
          'led a team',
        ),
      ];

      const facts = parseExtractedFacts(rows);

      expect(facts.map((f) => f.value)).toEqual(['built APIs', 'led a team']);
    });
  });
});
