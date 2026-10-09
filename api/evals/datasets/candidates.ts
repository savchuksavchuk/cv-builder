import type { Fact } from '../../src/modules/cv/domain/types/fact';
import candidatesJson from './candidates.json';

export type Candidate = {
  name: string;
  targetRole: string;
  // Text that must never appear in the CV, e.g. what a prompt injection asks for.
  mustNotMention: string[];
  // The verified facts the compose step receives.
  facts: Fact[];
};

export const candidates = candidatesJson as Candidate[];
