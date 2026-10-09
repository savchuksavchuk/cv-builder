import { createScorer } from 'evalite';
import { z } from 'zod';
import { UNTRUSTED_INPUT_RULE } from '../../src/modules/cv/application/llm/prompt-parts';
import { CvDocument } from '../../src/modules/cv/domain/types/cv-document';
import { composeFactsForPrompt } from '../../src/modules/cv/domain/utils/facts/compose-facts-for-prompt';
import { wrapUntrusted } from '../../src/modules/cv/domain/utils/untrusted/untrusted';
import type { Candidate } from '../datasets/candidates';
import { cvForJudge } from '../judge/cv-for-judge';
import { askJudge } from '../judge/judge';

const rating = z.number().int().min(1).max(5);

const ratingsOutput = z.object({
  summary: rating,
  ordering: rating,
  bullets: rating,
  reason: z.string().describe('A short explanation of the lowest rating'),
});

const JUDGE_SYSTEM = `You review how well an AI-written CV is tailored to a target role. You get the target role, the verified facts about the candidate and the CV.

The CV may use only what the facts say, so never expect or reward information the facts lack. Judge the selection, the order and the emphasis of what is there.

Rate each of the following from 1 to 5 (5 is best):
- summary: it opens with what matters most for the target role instead of a job history, it is 2-3 sentences and has no filler.
- ordering: the jobs most relevant to the target role come first, and inside each job the most relevant bullets come first.
- bullets: bullets of jobs far from the target role are cut to the few most relevant, relevant jobs keep their strong bullets, the wording puts the role-relevant side of a fact first, and the skills are a short relevant list without noise.

5 means excellent and nothing to improve, 3 means acceptable but generic or partly misordered, 1 means the target role was ignored.

${UNTRUSTED_INPUT_RULE}`;

export const roleRelevance = createScorer<Candidate, CvDocument>({
  name: 'Role relevance',
  description:
    'How well the summary, the order and the bullets fit the target role, judged by a stronger model.',
  scorer: async ({ input, output }) => {
    const ratings = await askJudge(
      ratingsOutput,
      JUDGE_SYSTEM,
      [
        wrapUntrusted('target_role', 'target_role', input.targetRole),
        wrapUntrusted('document', 'facts', composeFactsForPrompt(input.facts)),
        wrapUntrusted('document', 'cv', cvForJudge(output)),
      ].join('\n\n'),
    );

    const average = (ratings.summary + ratings.ordering + ratings.bullets) / 3;

    return {
      // 1 maps to 0 and 5 maps to 1.
      score: (average - 1) / 4,
      metadata: ratings,
    };
  },
});
