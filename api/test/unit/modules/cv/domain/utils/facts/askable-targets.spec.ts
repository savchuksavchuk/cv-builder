import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../../../../../../src/modules/cv/domain/types/fact';
import {
  Question,
  QuestionStatus,
  QuestionTarget,
} from '../../../../../../../src/modules/cv/domain/types/question';
import { askableTargets } from '../../../../../../../src/modules/cv/domain/utils/facts/askable-targets';

function factOf(
  section: FactSection,
  entryId: string,
  field: FactField,
  value: string,
): Fact {
  return {
    id: `${entryId}-${field}`,
    section,
    entryId,
    field,
    value,
    evidence: { source: INITIAL_USER_INPUT_SOURCE, quote: value },
  };
}

function questionAbout(
  target: QuestionTarget,
  status = QuestionStatus.Answered,
): Question {
  return {
    id: 'q1',
    target,
    question: '?',
    status,
    answer: 'an answer',
    createdAt: '',
    updatedAt: '',
  };
}

const job = factOf(
  FactSection.WorkExperience,
  'job-1',
  FactField.Company,
  'Acme',
);
const degree = factOf(FactSection.Education, 'edu-1', FactField.Degree, 'MSc');

function pathsOf(targets: Map<string, QuestionTarget>): string[] {
  return [...targets.keys()];
}

describe('askableTargets', () => {
  describe('work experience', () => {
    it('asks for the missing jobs when there are none', () => {
      expect(askableTargets([], []).has('work_experience')).toBe(true);
    });

    it('does not ask for missing jobs when there is at least one', () => {
      expect(askableTargets([job], []).has('work_experience')).toBe(false);
    });
  });

  describe('contacts', () => {
    it('offers the contact fields even when there are no facts', () => {
      const paths = pathsOf(askableTargets([], []));

      expect(paths).toContain('contacts');
      expect(paths).toContain('contacts.email');
      expect(paths).toContain('contacts.phone');
    });
  });

  describe('skills', () => {
    it('never asks about skills', () => {
      const skill = factOf(FactSection.Skills, 'skills', FactField.Skill, 'Go');

      const paths = pathsOf(askableTargets([skill], []));

      expect(paths.some((path) => path.startsWith('skills'))).toBe(false);
    });
  });

  describe('entries of the facts', () => {
    it('offers a whole entry and each of its fields', () => {
      const paths = pathsOf(askableTargets([degree], []));

      expect(paths).toContain('education.edu-1');
      expect(paths).toContain('education.edu-1.institution');
      expect(paths).toContain('education.edu-1.degree');
    });

    it('does not offer an entry that has no facts', () => {
      const paths = pathsOf(askableTargets([degree], []));

      expect(paths.some((path) => path.startsWith('education.edu-2'))).toBe(
        false,
      );
    });
  });

  describe('already asked questions', () => {
    it('does not offer an asked field again', () => {
      const asked = questionAbout({
        section: FactSection.Education,
        entryId: 'edu-1',
        field: FactField.Degree,
      });

      const targets = askableTargets([degree], [asked]);

      expect(targets.has('education.edu-1.degree')).toBe(false);
      expect(targets.has('education.edu-1.institution')).toBe(true);
    });

    it('does not offer the fields of an entry once the whole entry was asked', () => {
      const asked = questionAbout(
        { section: FactSection.Education, entryId: 'edu-1', field: null },
        QuestionStatus.Open,
      );

      const paths = pathsOf(askableTargets([degree], [asked]));

      expect(paths.some((path) => path.startsWith('education.'))).toBe(false);
    });

    it('does not offer the whole entry once one of its fields was asked', () => {
      const asked = questionAbout({
        section: FactSection.Education,
        entryId: 'edu-1',
        field: FactField.Degree,
      });

      const targets = askableTargets([degree], [asked]);

      expect(targets.has('education.edu-1')).toBe(false);
    });
  });

  describe('dismissed questions', () => {
    const dismissed = questionAbout(
      {
        section: FactSection.Education,
        entryId: 'edu-1',
        field: FactField.Degree,
      },
      QuestionStatus.Dismissed,
    );

    it('stops asking about the whole entry', () => {
      const paths = pathsOf(askableTargets([degree], [dismissed]));

      expect(paths.some((path) => path.startsWith('education.'))).toBe(false);
    });

    it('keeps asking about other entries and sections', () => {
      const otherDegree = factOf(
        FactSection.Education,
        'edu-2',
        FactField.Degree,
        'BSc',
      );

      const targets = askableTargets([degree, otherDegree], [dismissed]);

      expect(targets.has('education.edu-2.institution')).toBe(true);
      expect(targets.has('contacts.email')).toBe(true);
    });

    it('stops asking about contacts after a dismissed contact question', () => {
      const dismissedEmail = questionAbout(
        {
          section: FactSection.Contacts,
          entryId: 'contacts',
          field: FactField.Email,
        },
        QuestionStatus.Dismissed,
      );

      const paths = pathsOf(askableTargets([], [dismissedEmail]));

      expect(paths.some((path) => path.startsWith('contacts'))).toBe(false);
    });
  });
});
