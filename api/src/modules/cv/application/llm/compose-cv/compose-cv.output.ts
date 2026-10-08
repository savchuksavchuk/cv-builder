import { z } from 'zod';

export const composeCvOutput = z.object({
  summary: z
    .string()
    .describe('2-3 sentence professional summary built only from the facts'),
  skillIds: z
    .array(z.string())
    .describe('Ids of skills to show, most relevant to the target role first'),
  jobOrder: z
    .array(z.string())
    .describe('Ids of jobs, most relevant to the target role first'),
  bullets: z
    .array(
      z.object({
        jobId: z.string().describe('Id of the job the bullet belongs to'),
        text: z.string().describe('The bullet text'),
        sourceIds: z
          .array(z.string())
          .describe(
            'Ids of the responsibilities or achievements the bullet is based on',
          ),
      }),
    )
    .describe('CV bullets in the desired order, most relevant first'),
});
