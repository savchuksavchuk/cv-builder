import { LlmEffort, LlmModel } from '../../../shared/services/llm.service';
import { CvStep } from '../types/cv-step';

export const GENERATION_STEPS: CvStep[] = [
  CvStep.ParsePdf,
  CvStep.ExtractFacts,
  CvStep.ApplyAnswers,
  CvStep.VerifyEvidence,
  CvStep.GenerateQuestions,
  CvStep.AnswerQuestions,
  CvStep.ComposeCv,
  CvStep.ValidateResult,
];

export const NEXT_STEP: Partial<Record<CvStep, CvStep>> = {
  [CvStep.ParsePdf]: CvStep.ExtractFacts,
  [CvStep.ExtractFacts]: CvStep.VerifyEvidence,
  [CvStep.ApplyAnswers]: CvStep.VerifyEvidence,
  [CvStep.VerifyEvidence]: CvStep.GenerateQuestions,
  [CvStep.ComposeCv]: CvStep.ValidateResult,
};

export const STEP_MODELS: Partial<Record<CvStep, LlmModel>> = {
  [CvStep.ExtractFacts]: LlmModel.Haiku,
  [CvStep.GenerateQuestions]: LlmModel.Sonnet,
  [CvStep.ApplyAnswers]: LlmModel.Haiku,
  [CvStep.ComposeCv]: LlmModel.Sonnet,
  [CvStep.ValidateResult]: LlmModel.Sonnet,
};

export const STEP_EFFORT: Partial<Record<CvStep, LlmEffort>> = {
  [CvStep.ExtractFacts]: 'low',
  [CvStep.GenerateQuestions]: 'low',
  [CvStep.ApplyAnswers]: 'low',
  [CvStep.ComposeCv]: 'medium',
  [CvStep.ValidateResult]: 'medium',
};
