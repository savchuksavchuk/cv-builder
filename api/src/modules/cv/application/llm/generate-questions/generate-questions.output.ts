import { z } from 'zod';

export const generatedQuestionsOutput = z.object({
  questions: z.array(
    z.object({
      path: z
        .string()
        .describe(
          'One of the allowed paths (a field or a whole entry) the question is about',
        ),
      question: z
        .string()
        .describe(
          'A single question for the candidate; may ask for several missing fields of the same entry',
        ),
    }),
  ),
});
