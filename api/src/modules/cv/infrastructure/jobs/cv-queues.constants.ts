import { CvStep } from '../../domain/types/cv-step';

export const cvStepQueue = (step: CvStep): string => `cv.${step}`;

export type CvStepJobData = { cvId: string };
