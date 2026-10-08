import { z } from 'zod';

export const generatedQuestionsOutput = z.object({
  questions: z.array(
    z.object({
      path: z
        .string()
        .describe('One of the allowed paths the question is about'),
      question: z
        .string()
        .describe('A single, specific question for the candidate'),
    }),
  ),
});
