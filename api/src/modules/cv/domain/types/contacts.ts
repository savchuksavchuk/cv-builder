import { Fact, Item } from './fact';

export type Contacts = {
  fullName: Fact;
  email: Fact;
  phone: Fact;
  location: Fact;
  links: Item<Fact>[];
};
