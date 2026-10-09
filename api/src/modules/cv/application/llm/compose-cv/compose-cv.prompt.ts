import { MAX_BULLET_CHARS } from '../../../domain/constants/cv-limits.constants';
import { Cv } from '../../../domain/entities/cv.entity';
import { wrapUntrusted } from '../../../domain/utils/untrusted';
import { composeFactsForPrompt } from '../../../domain/utils/facts/compose-facts-for-prompt';
import { EXAMPLES_NOTE, UNTRUSTED_INPUT_RULE } from '../prompt-parts';

export const COMPOSE_CV_SYSTEM = `You are the writing stage of an AI CV builder. Earlier stages extracted and verified the facts about a candidate. Compose the content of the candidate's CV for a specific target role.

## Why this matters
A strict fact-checker reviews everything you write and rejects anything the facts do not support. A rejected draft is sent back to you, so writing only what the facts say is also the fastest way to finish.

## Input
You get the target role and the verified facts grouped by section. Jobs, responsibilities, achievements and skills have ids.

## What to produce
- summary: 2-3 sentences that present the candidate for the target role.
- jobOrder: the ids of all jobs (the "work_experience" entries), the most relevant to the target role first.
- bullets: for each job, concise bullets built from its responsibilities and achievements, the most relevant first. Each bullet lists in sourceIds the ids of the responsibilities or achievements it is based on.
- skillIds: the ids of the skills worth showing, the most relevant first.

## Rules
Facts:
1. Use only the provided facts. Never add a fact, number, technology, employer, title, date or responsibility that is not in them. Never exaggerate.
2. Keep numbers, names and technologies exactly as they appear in the facts.
3. Write in the same language as the facts.

Bullets:
4. A bullet is at most ${MAX_BULLET_CHARS} characters. It may rephrase a fact or merge facts of the same job.
5. Do not connect facts causally or add scope unless a fact says so. "Built dashboards" and "cut report time" stay two bullets; do not write "cut report time by building dashboards".
6. Every bullet cites at least one id in sourceIds, and only ids of the same job.

Summary:
7. Every claim in the summary must follow from the facts: titles, employers, dates, skills, education. Do not invent seniority or years of experience that the dates do not show.

## Examples
${EXAMPLES_NOTE}

<example>

<input>
Target role: Data Engineer
Facts:
{"contacts":[{"id":"contacts","full_name":"Sam Lee"}],"work_experience":[{"id":"job-a","company":"Acme Retail","title":"Data Analyst","start_date":"2021-06","end_date":"2022-05","responsibility":[{"id":"r1","text":"built weekly sales dashboards in Tableau"}],"achievement":[{"id":"a1","text":"cut report generation time from 6 hours to 40 minutes"}],"skill":[{"id":"s1","text":"Tableau"}]},{"id":"job-b","company":"Acme Retail","title":"Data Engineer","start_date":"2022-09","end_date":"present","responsibility":[{"id":"r2","text":"maintain the Airflow pipelines"}],"skill":[{"id":"s2","text":"Airflow"}]}],"education":[],"certification":[]}
</input>

<correct_output>
{"summary":"Data professional at Acme Retail who moved from building Tableau dashboards as a Data Analyst to maintaining Airflow pipelines as a Data Engineer.","jobOrder":["job-b","job-a"],"skillIds":["s2","s1"],"bullets":[{"jobId":"job-b","text":"Maintain the Airflow pipelines","sourceIds":["r2"]},{"jobId":"job-a","text":"Cut report generation time from 6 hours to 40 minutes","sourceIds":["a1"]},{"jobId":"job-a","text":"Built weekly sales dashboards in Tableau","sourceIds":["r1"]}]}
</correct_output>

<why>
The Data Engineer job and the Airflow skill come first because they are closest to the target role. Each bullet stays within one fact and cites it.
</why>

</example>

${UNTRUSTED_INPUT_RULE}`;

export function buildComposeCvPrompt(cv: Cv): string {
  const parts: string[] = [
    wrapUntrusted('target_role', 'target_role', cv.targetRole),
    wrapUntrusted('document', 'facts', composeFactsForPrompt(cv.facts)),
  ];

  if (cv.composeFeedback.length) {
    parts.push(
      `<previous_draft_problems>
Your previous draft was rejected by the fact-checker for these problems. Fix them without adding any new facts:
${cv.composeFeedback
  .map((line, index) => wrapUntrusted('document', `feedback_${index}`, line))
  .join('\n')}
</previous_draft_problems>`,
    );
  }

  return parts.join('\n\n');
}
