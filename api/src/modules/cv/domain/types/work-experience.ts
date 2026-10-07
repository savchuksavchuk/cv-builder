import { EndDate, Fact, Item, YearMonth } from './fact';

export type WorkExperience = Item<{
  company: Fact;
  title: Fact;
  location: Fact;
  startDate: Fact<YearMonth>;
  endDate: Fact<EndDate>;
  responsibilities: Item<Fact>[];
  achievements: Item<Fact>[];
  skills: Item<Fact>[];
}>;
