import { CvStep } from '../types/cv-step';

export const GENERATION_STEPS: CvStep[] = [
  CvStep.ParsePdf,
  CvStep.ExtractFacts,
  CvStep.VerifyEvidence,
  CvStep.TailorToRole,
  CvStep.GenerateQuestions,
];
