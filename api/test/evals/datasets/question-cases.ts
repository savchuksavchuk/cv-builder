import questionCasesJson from './question-cases.json';

export type QuestionCase = {
  name: string;
  candidate: string;
  dropFactIds: string[];
  mustAsk: string[];
  mustNotAsk: string[];
};

export const questionCases = questionCasesJson as QuestionCase[];
