import { Cv } from '../../../domain/entities/cv.entity';
import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../../domain/types/fact';
import { Question, QuestionStatus } from '../../../domain/types/question';
import { buildGenerateQuestionsPrompt } from './generate-questions.prompt';
import {
  INJECTION,
  INJECTION_MARKER,
  withoutUntrustedBlocks,
} from '../../../domain/utils/untrusted/untrusted.testing';

function companyFact(value: string): Fact {
  return {
    id: 'fact-1',
    section: FactSection.WorkExperience,
    entryId: 'job-1',
    field: FactField.Company,
    value,
    evidence: { source: INITIAL_USER_INPUT_SOURCE, quote: value },
  };
}

function askedQuestion(question: string, answer: string | null): Question {
  return {
    id: 'q1',
    target: {
      section: FactSection.Contacts,
      entryId: 'contacts',
      field: FactField.Email,
    },
    question,
    status: QuestionStatus.Answered,
    answer,
    createdAt: '',
    updatedAt: '',
  };
}

function cvWith(
  targetRole: string,
  factValue: string,
  questions: Question[] = [],
): Cv {
  const cv = Cv.create('user-1', targetRole, '', null);
  cv.facts = [companyFact(factValue)];
  cv.questions = questions;
  return cv;
}

const paths = ['contacts.email'];

describe('buildGenerateQuestionsPrompt', () => {
  it('keeps the target role inside an untrusted block', () => {
    const prompt = buildGenerateQuestionsPrompt(
      cvWith(INJECTION, 'Acme'),
      paths,
    );

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the facts inside an untrusted block', () => {
    const prompt = buildGenerateQuestionsPrompt(
      cvWith('Engineer', INJECTION),
      paths,
    );

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the answers to earlier questions inside an untrusted block', () => {
    const cv = cvWith('Engineer', 'Acme', [askedQuestion('Email?', INJECTION)]);

    const prompt = buildGenerateQuestionsPrompt(cv, paths);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  // The text of a question is written by the model after reading the CV,
  // so it can carry an injection from the CV into later prompts.
  it('keeps the text of earlier questions inside an untrusted block', () => {
    const cv = cvWith('Engineer', 'Acme', [askedQuestion(INJECTION, null)]);

    const prompt = buildGenerateQuestionsPrompt(cv, paths);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('lists the allowed paths', () => {
    const prompt = buildGenerateQuestionsPrompt(cvWith('Engineer', 'Acme'), [
      'contacts.email',
      'contacts.phone',
    ]);

    expect(prompt).toContain('contacts.email\ncontacts.phone');
  });
});
