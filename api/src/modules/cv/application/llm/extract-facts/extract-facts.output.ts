import { z } from 'zod';
import { FactField, FactSection } from '../../../domain/types/fact';

export const extractedFactsOutput = z.object({
  facts: z.array(
    z.object({
      section: z.enum(FactSection).describe('CV section the fact belongs to'),
      entry: z
        .number()
        .int()
        .describe(
          '0-based index of the job / education / certification the fact belongs to, in source order. Always 0 for contacts',
        ),
      field: z
        .enum(FactField)
        .describe('Field of the section; must be valid for that section'),
      value: z.string().describe('The fact itself, as stated in the source'),
      quote: z
        .string()
        .describe('Verbatim fragment of the source that supports the value'),
    }),
  ),
});
