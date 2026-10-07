import { LlmModel } from '../../../shared/services/llm.service';
import { CvStep } from '../types/cv-step';

export const GENERATION_STEPS: CvStep[] = [
  CvStep.ParsePdf,
  CvStep.ExtractFacts,
  CvStep.VerifyEvidence,
  CvStep.TailorToRole,
  CvStep.GenerateQuestions,
];

export const STEP_MODELS: Partial<Record<CvStep, LlmModel>> = {
  [CvStep.ExtractFacts]: LlmModel.Sonnet,
};
