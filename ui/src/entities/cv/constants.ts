import { CvStatus, CvStep } from './types'

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

export const STATUS_LABELS: Record<CvStatus, string> = {
  [CvStatus.Processing]: 'In progress',
  [CvStatus.Completed]: 'Completed',
  [CvStatus.Failed]: 'Failed',
}
