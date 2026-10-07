import { LlmModel } from '../../../shared/services/llm.service';
import { CvStep } from '../types/cv-step';

export const GENERATION_STEPS: CvStep[] = [
  CvStep.ParsePdf,
  CvStep.ExtractFacts,
  CvStep.ApplyAnswers,
  CvStep.VerifyEvidence,
  CvStep.GenerateQuestions,
  CvStep.AnswerQuestions,
  CvStep.TailorToRole,
];

export const NEXT_STEP: Partial<Record<CvStep, CvStep>> = {
  [CvStep.ParsePdf]: CvStep.ExtractFacts,
  [CvStep.ExtractFacts]: CvStep.VerifyEvidence,
  [CvStep.ApplyAnswers]: CvStep.VerifyEvidence,
  [CvStep.VerifyEvidence]: CvStep.GenerateQuestions,
};

export const STEP_MODELS: Partial<Record<CvStep, LlmModel>> = {
  [CvStep.ExtractFacts]: LlmModel.Sonnet,
  [CvStep.GenerateQuestions]: LlmModel.Sonnet,
  [CvStep.ApplyAnswers]: LlmModel.Sonnet,
};
