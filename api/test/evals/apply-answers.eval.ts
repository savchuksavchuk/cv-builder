import { evalite } from 'evalite';
import { AnswerCase, answerCases } from './datasets/answer-cases';
import { answerApplied } from './scorers/answer-applied.scorer';
import { noInventedAnswerFacts } from './scorers/no-invented-answer-facts.scorer';
import { onlyTargetedChanged } from './scorers/only-targeted-changed.scorer';
import { Applied, applyAnswers } from './tasks/apply-answers.task';

evalite<AnswerCase, Applied>('Apply answers', {
  data: () => answerCases.map((testCase) => ({ input: testCase })),
  task: applyAnswers,
  scorers: [answerApplied, onlyTargetedChanged, noInventedAnswerFacts],
  columns: ({ input, output }) => [
    { label: 'Case', value: input.name },
    {
      label: 'Added',
      value:
        output.after
          .filter((f) => !output.before.includes(f))
          .map((f) => `${f.entryId}.${f.field}=${f.value}`)
          .join('; ') || '-',
    },
  ],
});
