import { EndDate, Fact, Item, YearMonth } from './fact';

export type Education = Item<{
  institution: Fact;
  degree: Fact;
  fieldOfStudy: Fact;
  startDate: Fact<YearMonth>;
  endDate: Fact<EndDate>;
}>;
