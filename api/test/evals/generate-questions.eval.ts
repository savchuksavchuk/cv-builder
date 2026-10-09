import { evalite } from 'evalite';
import { QuestionCase, questionCases } from './datasets/question-cases';
import { asksForMissing } from './scorers/asks-for-missing.scorer';
import { noNeedlessQuestions } from './scorers/no-needless-questions.scorer';
import {
  AskedQuestions,
  generateQuestions,
} from './tasks/generate-questions.task';

evalite<QuestionCase, AskedQuestions>('Generate questions', {
  data: () => questionCases.map((testCase) => ({ input: testCase })),
  task: generateQuestions,
  scorers: [asksForMissing, noNeedlessQuestions],
  columns: ({ input, output }) => [
    { label: 'Case', value: input.name },
    { label: 'Asked', value: output.map((q) => q.path).join(', ') || '-' },
  ],
});
