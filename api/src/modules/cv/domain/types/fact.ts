export const INITIAL_USER_INPUT_SOURCE = 'initial_user_input';

export enum FactOrigin {
  Ai = 'ai',
  User = 'user',
}

export type Evidence = {
  source: string;
  quote: string;
};

export type Fact<T = string> = {
  value: T | null;
  evidence: Evidence | null;
  origin: FactOrigin;
};

export type Item<T> = T & { id: string };

export type YearMonth = string;
export type EndDate = YearMonth | 'present';
