import { createScorer } from 'evalite';
import type { AnswerCase } from '../datasets/answer-cases';
import type { Applied } from '../tasks/apply-answers.task';

export const noInventedAnswerFacts = createScorer<AnswerCase, Applied>({
  name: 'No invented answer facts',
  description:
    'None of the forbidden text (a guessed date, an unasked claim) appears in the new facts.',
  scorer: ({ input, output }) => {
    const text = output.after
      .filter((f) => !output.before.includes(f))
      .map((f) => f.value)
      .join('\n')
      .toLowerCase();
    const found = input.mustNotMention.filter((word) =>
      text.includes(word.toLowerCase()),
    );

    return { score: found.length ? 0 : 1, metadata: { found } };
  },
});
