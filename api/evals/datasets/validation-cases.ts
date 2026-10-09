import validationCasesJson from './validation-cases.json';

export type ValidationCase = {
  name: string;
  candidate: string;
  summary: { text: string; supported: boolean; note: string };
  bullets: {
    id: string;
    text: string;
    sourceIds: string[];
    supported: boolean;
    note: string;
  }[];
};

export const validationCases = validationCasesJson as ValidationCase[];
