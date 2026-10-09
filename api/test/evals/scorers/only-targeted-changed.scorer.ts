import { createScorer } from 'evalite';
import type { AnswerCase } from '../datasets/answer-cases';
import type { Applied } from '../tasks/apply-answers.task';

export const onlyTargetedChanged = createScorer<AnswerCase, Applied>({
  name: 'Only targeted changed',
  description:
    'Facts outside the entries the questions asked about stay exactly as they were.',
  scorer: ({ input, output }) => {
    const targeted = new Set(input.questions.map((q) => q.entryId));
    const untouched = (facts: typeof output.after) =>
      facts.filter((f) => !targeted.has(f.entryId));

    const changed = [
      ...untouched(output.before).filter((f) => !output.after.includes(f)),
      ...untouched(output.after).filter((f) => !output.before.includes(f)),
    ];

    return {
      score: changed.length ? 0 : 1,
      metadata: { changed: changed.map((f) => f.id) },
    };
  },
});
