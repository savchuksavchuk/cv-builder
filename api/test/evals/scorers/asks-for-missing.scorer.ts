import { createScorer } from 'evalite';
import type { QuestionCase } from '../datasets/question-cases';
import type { AskedQuestions } from '../tasks/generate-questions.task';

export const asksForMissing = createScorer<QuestionCase, AskedQuestions>({
  name: 'Asks for missing',
  description:
    'Share of the removed facts that a question covers, by field or by its whole entry.',
  scorer: ({ input, output }) => {
    const missed = input.mustAsk.filter(
      (path) =>
        !output.some((q) => path === q.path || path.startsWith(`${q.path}.`)),
    );

    return {
      score: 1 - missed.length / input.mustAsk.length,
      metadata: { asked: output.map((q) => q.path), missed },
    };
  },
});
