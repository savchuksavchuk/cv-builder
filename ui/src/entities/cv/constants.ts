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

export const CV_LIMITS = {
  TARGET_ROLE: 120,
  INPUT_TEXT: 20_000,
  ANSWER: 2_000,
  FIELD: 200,
  BULLET: 400,
  SUMMARY: 2_000,
  LIST_ITEMS: 50,
  PDF_BYTES: 10 * 1024 * 1024,
}
