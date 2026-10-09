import type {
  FactField,
  FactSection,
} from '../../../src/modules/cv/domain/types/fact';
import answerCasesJson from './answer-cases.json';

export type AnswerCase = {
  name: string;
  candidate: string;
  dropFactIds: string[];
  questions: {
    section: FactSection;
    entryId: string;
    field: FactField;
    question: string;
    answer: string;
  }[];
  expected: { entryId: string; field: FactField; value: string }[];
  mustNotMention: string[];
};

export const answerCases = answerCasesJson as AnswerCase[];
