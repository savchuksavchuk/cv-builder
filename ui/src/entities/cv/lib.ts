import { CvStatus, CvStep, type CvSummary } from './types'

export const WIZARD_STEPS = [
  { id: 'input', label: 'Input' },
  { id: 'review', label: 'Review' },
  { id: 'questions', label: 'Questions' },
  { id: 'generation', label: 'Generation' },
  { id: 'edit', label: 'Edit' },
  { id: 'download', label: 'Download' },
] as const

export type WizardStep = (typeof WIZARD_STEPS)[number]['id']

const STEP_TO_WIZARD: Record<CvStep, WizardStep> = {
  [CvStep.ParsePdf]: 'review',
  [CvStep.ExtractFacts]: 'review',
  [CvStep.VerifyEvidence]: 'review',
  [CvStep.GenerateQuestions]: 'review',
  [CvStep.AnswerQuestions]: 'questions',
  [CvStep.ApplyAnswers]: 'questions',
  [CvStep.ComposeCv]: 'generation',
  [CvStep.ValidateResult]: 'generation',
}

export const STEP_LABELS: Record<CvStep, string> = {
  [CvStep.ParsePdf]: 'Reading your PDF',
  [CvStep.ExtractFacts]: 'Extracting facts',
  [CvStep.VerifyEvidence]: 'Verifying facts',
  [CvStep.GenerateQuestions]: 'Preparing questions',
  [CvStep.AnswerQuestions]: 'Waiting for your answers',
  [CvStep.ApplyAnswers]: 'Applying your answers',
  [CvStep.ComposeCv]: 'Composing your CV',
  [CvStep.ValidateResult]: 'Validating the result',
}

type CvState = Pick<CvSummary, 'status' | 'currentStep'>

// null for failed: the wizard has no step to show, only the failure reason
export const getWizardStep = ({ status, currentStep }: CvState) => {
  if (status === CvStatus.Completed) {
    return 'edit'
  }

  if (status === CvStatus.Failed || !currentStep) {
    return null
  }

  return STEP_TO_WIZARD[currentStep]
}

export const needsAttention = ({ status, currentStep }: CvState) =>
  status === CvStatus.Processing && currentStep === CvStep.AnswerQuestions

export const isPollingDone = ({ status, currentStep }: CvState) =>
  status !== CvStatus.Processing || currentStep === CvStep.AnswerQuestions

export const STATUS_LABELS: Record<CvStatus, string> = {
  [CvStatus.Processing]: 'In progress',
  [CvStatus.Completed]: 'Completed',
  [CvStatus.Failed]: 'Failed',
}
