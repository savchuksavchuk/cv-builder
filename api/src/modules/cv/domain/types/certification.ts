import { Fact, Item, YearMonth } from './fact';

export type Certification = Item<{
  name: Fact;
  issuer: Fact;
  issueDate: Fact<YearMonth>;
}>;
