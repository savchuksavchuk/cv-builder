import { createScorer } from 'evalite';
import type { QuestionCase } from '../datasets/question-cases';
import type { AskedQuestions } from '../tasks/generate-questions.task';

export const noNeedlessQuestions = createScorer<QuestionCase, AskedQuestions>({
  name: 'No needless questions',
  description: 'Share of the questions that do not ask about a known fact.',
  scorer: ({ input, output }) => {
    const needless = output.filter((q) =>
      input.mustNotAsk.some(
        (path) => q.path === path || q.path.startsWith(`${path}.`),
      ),
    );

    return {
      score: output.length ? 1 - needless.length / output.length : 1,
      metadata: { needless: needless.map((q) => q.path) },
    };
  },
});
