import { CvStatus, CvStep, type CvSummary } from '@/entities/cv'

export enum WizardStep {
  Input = 'input',
  Review = 'review',
  Questions = 'questions',
  Generation = 'generation',
  Edit = 'edit',
}

export const WIZARD_STEPS = [
  { id: WizardStep.Input, label: 'Input' },
  { id: WizardStep.Review, label: 'Review' },
  { id: WizardStep.Questions, label: 'Questions' },
  { id: WizardStep.Generation, label: 'Generation' },
  { id: WizardStep.Edit, label: 'Edit' },
]

const STEP_TO_WIZARD: Record<CvStep, WizardStep> = {
  [CvStep.ParsePdf]: WizardStep.Review,
  [CvStep.ExtractFacts]: WizardStep.Review,
  [CvStep.VerifyEvidence]: WizardStep.Review,
  [CvStep.GenerateQuestions]: WizardStep.Review,
  [CvStep.AnswerQuestions]: WizardStep.Questions,
  [CvStep.ApplyAnswers]: WizardStep.Questions,
  [CvStep.ComposeCv]: WizardStep.Generation,
  [CvStep.ValidateResult]: WizardStep.Generation,
}

export const getWizardStep = ({
  status,
  currentStep,
}: Pick<CvSummary, 'status' | 'currentStep'>) => {
  if (status === CvStatus.Completed) {
    return WizardStep.Edit
  }

  if (status === CvStatus.Failed || !currentStep) {
    return null
  }

  return STEP_TO_WIZARD[currentStep]
}
