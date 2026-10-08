import { FactField, FactSection } from './fact';

export enum QuestionStatus {
  Open = 'open',
  Answered = 'answered',
  Applied = 'applied',
  Dismissed = 'dismissed',
}

export type QuestionTarget =
  | { section: FactSection; entryId: string; field: FactField }
  | { section: FactSection.WorkExperience; entryId: null; field: null };

export function pathOf(target: QuestionTarget): string {
  return [
    target.section,
    target.section === FactSection.Contacts ? null : target.entryId,
    target.field,
  ]
    .filter(Boolean)
    .join('.');
}

export type QuestionDraft = { target: QuestionTarget; question: string };

export type Question = {
  id: string;
  target: QuestionTarget;
  question: string;
  status: QuestionStatus;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
};
