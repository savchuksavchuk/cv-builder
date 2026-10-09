import { createAnthropic } from '@ai-sdk/anthropic';
import { Output, generateText } from 'ai';
import type { z } from 'zod';

// A stronger model than the ones that write the CV, so it does not just
// approve its own style.
const JUDGE_MODEL = 'claude-opus-5-5';

export async function askJudge<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string,
): Promise<T> {
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { output } = await generateText({
    model: anthropic(JUDGE_MODEL),
    output: Output.object({ schema }),
    system,
    prompt,
    providerOptions: { anthropic: { effort: 'medium' } },
  });

  return output;
}
