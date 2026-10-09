import cvTextsJson from './cv-texts.json';

export type CvText = {
  name: string;
  lines: string[];
  mustFind: string[];
  mustNotMention: string[];
  noFactsInSections: string[];
};

export const cvTexts = cvTextsJson as CvText[];
