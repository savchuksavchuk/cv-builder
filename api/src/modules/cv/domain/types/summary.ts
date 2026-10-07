import { FactOrigin } from './fact';

export type Summary = {
  value: string;
  origin: FactOrigin;
  basedOn: string[];
};
