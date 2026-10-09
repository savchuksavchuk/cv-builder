import { createScorer } from 'evalite';
import { z } from 'zod';
import { UNTRUSTED_INPUT_RULE } from '../../../src/modules/cv/application/llm/prompt-parts';
import { CvDocument } from '../../../src/modules/cv/domain/types/cv-document';
import { composeFactsForPrompt } from '../../../src/modules/cv/domain/utils/facts/compose-facts-for-prompt';
import { wrapUntrusted } from '../../../src/modules/cv/domain/utils/untrusted/untrusted';
import type { Candidate } from '../datasets/candidates';
import { cvForJudge } from '../judge/cv-for-judge';
import { askJudge } from '../judge/judge';

const verdictOutput = z.object({
  claims: z.array(
    z.object({
      text: z.string().describe('The claim, quoted from the CV'),
      supported: z.boolean(),
      reason: z
        .string()
        .describe('What supports the claim, or what it adds; one sentence'),
    }),
  ),
});

const JUDGE_SYSTEM = `You are an independent auditor of an AI-written CV. You get verified facts about a candidate and the text of the CV: a summary, skills and bullets.

List every claim of the CV: each sentence or clause of the summary, each skill and each bullet. For every claim decide whether the facts support it.

A claim is supported when the facts state it, or when it only rephrases, reorders or condenses what the facts state without changing the meaning. A duration worked out from start and end dates is supported, and so is wording that uses the vocabulary of the target role as long as the meaning of the fact is unchanged.

A claim is NOT supported when it adds anything the facts do not state: a number, technology, tool, employer, title, date, team size, scope or seniority. It is also not supported when it exaggerates (led instead of took part, owned instead of contributed), implies a result or a cause the facts do not state, or gives the candidate the target role as a title without a job that has it.

Judge only against the facts, never against what is plausible. Be strict: when unsure, mark the claim not supported.

${UNTRUSTED_INPUT_RULE}`;

export const faithfulness = createScorer<Candidate, CvDocument>({
  name: 'Faithfulness',
  description:
    'Share of the CV claims that the facts support, judged by a stronger model.',
  scorer: async ({ input, output }) => {
    const verdict = await askJudge(
      verdictOutput,
      JUDGE_SYSTEM,
      [
        wrapUntrusted('target_role', 'target_role', input.targetRole),
        wrapUntrusted('document', 'facts', composeFactsForPrompt(input.facts)),
        wrapUntrusted('document', 'cv', cvForJudge(output)),
      ].join('\n\n'),
    );

    if (!verdict.claims.length) {
      return { score: 0, metadata: { problem: 'The judge listed no claims' } };
    }

    const unsupported = verdict.claims.filter((claim) => !claim.supported);

    return {
      score: 1 - unsupported.length / verdict.claims.length,
      metadata: { claims: verdict.claims.length, unsupported },
    };
  },
});
