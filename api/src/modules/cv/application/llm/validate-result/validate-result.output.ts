import { z } from 'zod';

export const validateResultOutput = z.object({
  summarySupported: z
    .boolean()
    .describe('True if every claim of the summary is supported by the facts'),
  summaryReason: z
    .string()
    .describe('Why the summary is not supported; empty string if supported'),
  bullets: z.array(
    z.object({
      id: z.string().describe('Id of the bullet'),
      supported: z
        .boolean()
        .describe('True if the bullet is fully supported by its sources'),
      reason: z
        .string()
        .describe('Why the bullet is not supported; empty string if supported'),
    }),
  ),
});
