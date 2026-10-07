import { z } from 'zod';
import { Question, QuestionStatus } from '../../domain/types/question';
import { VerifiableSections } from '../../domain/utils/verify-evidence';
import {
  FactField,
  FactSection,
  RawFact,
  toCvSections,
  toFact,
  toItems,
} from './extracted-facts.output';

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

type AnswerFact = z.infer<typeof applyAnswersOutput>['facts'][number];

const FIELD_BY_KEY: Record<string, FactField> = {
  fullName: FactField.FullName,
  email: FactField.Email,
  phone: FactField.Phone,
  location: FactField.Location,
  links: FactField.Link,
  company: FactField.Company,
  title: FactField.Title,
  startDate: FactField.StartDate,
  endDate: FactField.EndDate,
  responsibilities: FactField.Responsibility,
  achievements: FactField.Achievement,
  skills: FactField.Skill,
  institution: FactField.Institution,
  degree: FactField.Degree,
  fieldOfStudy: FactField.FieldOfStudy,
  name: FactField.Name,
  issuer: FactField.Issuer,
  issueDate: FactField.IssueDate,
};

const LIST_KEYS = new Set([
  'links',
  'responsibilities',
  'achievements',
  'skills',
]);

type Target = Record<string, unknown>;

export function answeredQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.status === QuestionStatus.Answered);
}

export function toAnswerSections(
  sections: VerifiableSections,
  questions: Question[],
  facts: AnswerFact[],
): VerifiableSections {
  const next = structuredClone(sections);

  for (const question of questions) {
    const own = facts.filter(
      (fact) =>
        fact.questionId === question.id &&
        fact.value.trim() &&
        fact.quote.trim(),
    );

    if (question.path === 'workExperience') {
      next.workExperience.push(
        ...toCvSections(
          {
            facts: own.map((fact) => ({
              ...fact,
              section: FactSection.WorkExperience,
            })),
          },
          question.id,
        ).workExperience,
      );
      continue;
    }

    const [section, ...rest] = question.path.split('.');
    const key = rest[rest.length - 1];
    const target: Target | undefined =
      section === 'contacts'
        ? (next.contacts ?? undefined)
        : (
            next[
              section as 'workExperience' | 'education' | 'certifications'
            ] as { id: string }[] | undefined
          )?.find((item) => item.id === rest[0]);
    const field = FIELD_BY_KEY[key];

    if (!target || !field || !(key in target)) {
      continue;
    }

    const matching: RawFact[] = own.filter((fact) => fact.field === field);

    if (LIST_KEYS.has(key)) {
      target[key] = [
        ...(target[key] as unknown[]),
        ...toItems(matching, question.id),
      ];
    } else if (matching.length) {
      target[key] = toFact(matching[0], question.id);
    }
  }

  return next;
}
