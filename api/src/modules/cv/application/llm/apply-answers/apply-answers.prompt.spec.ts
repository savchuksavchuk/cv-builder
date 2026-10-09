import { FactField, FactSection } from '../../../domain/types/fact';
import { Question, QuestionStatus } from '../../../domain/types/question';
import { buildApplyAnswersPrompt } from './apply-answers.prompt';
import {
  INJECTION,
  INJECTION_MARKER,
  withoutUntrustedBlocks,
} from '../../../domain/utils/untrusted/untrusted.testing';

function answeredQuestion(
  id: string,
  question: string,
  answer: string,
): Question {
  return {
    id,
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

describe('buildApplyAnswersPrompt', () => {
  it('keeps the answer inside an untrusted block', () => {
    const questions = [answeredQuestion('q1', 'Email?', INJECTION)];

    const prompt = buildApplyAnswersPrompt(questions);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the text of the question inside an untrusted block', () => {
    const questions = [answeredQuestion('q1', INJECTION, 'jane@x.io')];

    const prompt = buildApplyAnswersPrompt(questions);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('describes every question with its id, path and answer', () => {
    const questions = [
      answeredQuestion('q1', 'Email?', 'jane@x.io'),
      answeredQuestion('q2', 'Phone?', '555-0100'),
    ];

    const prompt = buildApplyAnswersPrompt(questions);

    expect(prompt).toContain('questionId: q1\npath: contacts.email');
    expect(prompt).toContain('questionId: q2\npath: contacts.email');
    expect(prompt).toContain('jane@x.io');
    expect(prompt).toContain('555-0100');
  });
});
