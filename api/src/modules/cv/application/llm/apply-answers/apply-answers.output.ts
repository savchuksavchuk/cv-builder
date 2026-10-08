import { z } from 'zod';
import { FactField } from '../../../domain/types/fact';

export const applyAnswersOutput = z.object({
  facts: z.array(
    z.object({
      questionId: z.string().describe('Id of the question the fact answers'),
      entry: z
        .number()
        .int()
        .describe(
          '0-based index of the job the fact belongs to; only used for work experience questions, otherwise 0',
        ),
      field: z
        .enum(FactField)
        .describe('Field the fact fills; must match the question'),
      value: z.string().describe('The fact itself, as stated in the answer'),
      quote: z
        .string()
        .describe('Verbatim fragment of the answer that supports the value'),
    }),
  ),
});
