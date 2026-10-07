export enum QuestionStatus {
  Open = 'open',
  Answered = 'answered',
  Applied = 'applied',
  Dismissed = 'dismissed',
}

export type Question = {
  id: string;
  path: string;
  question: string;
  status: QuestionStatus;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
};
