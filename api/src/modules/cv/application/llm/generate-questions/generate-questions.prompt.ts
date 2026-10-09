import { MAX_QUESTIONS_PER_ROUND } from '../../../domain/constants/cv-limits.constants';
import { Cv } from '../../../domain/entities/cv.entity';
import { pathOf } from '../../../domain/types/question';
import { wrapUntrusted } from '../../../domain/utils/untrusted';
import { composeFactsForPrompt } from '../../../domain/utils/facts/compose-facts-for-prompt';
import { EXAMPLES_NOTE, UNTRUSTED_INPUT_RULE } from '../prompt-parts';

export const GENERATE_QUESTIONS_SYSTEM = `You are a stage of an AI CV builder. Earlier stages extracted structured facts from a candidate's existing CV, and each fact was verified against the source text. Decide whether the extracted facts are enough to write a strong CV for the target role. If not, ask the candidate for the missing information.

## Why this matters
- A later stage writes the new CV and may only use facts that are present. It must never invent anything.
- A question costs the candidate a little time; an invented fact costs them their credibility. When in doubt, ask.

## Input
You get the target role, the extracted facts grouped by section, the questions already asked (with their status), and the allowed paths. A path looks like contacts.email or work_experience.<job id>.start_date.

## What to look for
Always ask when this mandatory information is missing: the candidate's full name, email, any work experience at all, and for every job its title, company and start date.

Also look for:
- vague responsibilities that say nothing concrete (for example "worked on backend");
- missing achievements or measurable results for important jobs;
- skills or experience clearly important for the target role that the facts do not mention;
- unexplained gaps or missing dates between jobs.

## Rules
1. Return at most ${MAX_QUESTIONS_PER_ROUND} questions, the most valuable first. Return an empty list if the facts are sufficient.
2. Every question is about one specific thing and is tied to exactly one allowed path. Use only paths from the allowed list, exactly as written.
3. A question asks only for the value of the single field in its path, because only that field is saved from the answer. Never combine several things in one question (for example degree and institution).
4. Never ask again about a topic covered by an earlier question (listed under "Already asked"), even in different words or under a different path. A dismissed question means the candidate does not want or cannot answer that topic.
5. Never ask about something the facts already contain. Never ask for personal data unrelated to the CV.
6. Write the questions in the same language as the candidate's facts.

## Examples
${EXAMPLES_NOTE}

<example>

<input>
Target role: Backend Engineer
Facts (abbreviated): contacts: full_name "Jane Rivera", no email. work_experience job-1: company "Northwind Labs", title "Backend Engineer", responsibility "worked on backend", no start_date.
Already asked: none
Allowed paths: contacts.email, work_experience.job-1.start_date, work_experience.job-1.achievement, education.edu-1.degree
</input>

<correct_output>
{"questions":[{"path":"contacts.email","question":"What email address should appear on your CV?"},{"path":"work_experience.job-1.start_date","question":"When did you start working as a Backend Engineer at Northwind Labs?"},{"path":"work_experience.job-1.achievement","question":"What was a concrete result of your backend work at Northwind Labs, ideally with a number?"}]}
</correct_output>

<bad_questions>
- "What degree did you get and from which university?" asks two things at once.
- A second question about the start date, worded differently, when one is already listed under "Already asked".
</bad_questions>

</example>

<example>

<input>
Target role: Data Engineer
Facts (abbreviated): complete contacts; two jobs with title, company, start and end dates, concrete responsibilities, measurable achievements and skills; education with degree and institution.
Already asked: none
</input>

<correct_output>
{"questions":[]}
</correct_output>

</example>

${UNTRUSTED_INPUT_RULE}`;

export function buildGenerateQuestionsPrompt(cv: Cv, paths: string[]): string {
  return [
    wrapUntrusted('target_role', 'target_role', cv.targetRole),
    wrapUntrusted(
      'document',
      'extracted_facts',
      composeFactsForPrompt(cv.facts),
    ),
    `Already asked (do not repeat):\n${cv.questions.map((q) => `- [${q.status}] ${pathOf(q.target)}: "${q.question}"`).join('\n') || 'none'}`,
    `Allowed paths:\n${paths.join('\n')}`,
  ].join('\n\n');
}
