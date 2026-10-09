import { createScorer } from 'evalite';
import type { AnswerCase } from '../datasets/answer-cases';
import type { Applied } from '../tasks/apply-answers.task';

export const answerApplied = createScorer<AnswerCase, Applied>({
  name: 'Answer applied',
  description: 'Share of the expected facts that the answers added.',
  scorer: ({ input, output }) => {
    const added = output.after.filter((f) => !output.before.includes(f));
    const missing = input.expected.filter(
      (e) =>
        !added.some(
          (f) =>
            f.entryId === e.entryId &&
            f.field === e.field &&
            f.value.toLowerCase().includes(e.value.toLowerCase()),
        ),
    );

    return {
      score: input.expected.length
        ? 1 - missing.length / input.expected.length
        : 1,
      metadata: { missing },
    };
  },
});
