import type { CvDocument } from '@cv-builder/cv-template'

export type { CvDocument }

export enum CvStatus {
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum CvStep {
  ParsePdf = 'parse_pdf',
  ExtractFacts = 'extract_facts',
  VerifyEvidence = 'verify_evidence',
  GenerateQuestions = 'generate_questions',
  AnswerQuestions = 'answer_questions',
  ApplyAnswers = 'apply_answers',
  ComposeCv = 'compose_cv',
  ValidateResult = 'validate_result',
}

export enum CvQuestionStatus {
  Open = 'open',
}

export interface CvQuestion {
  id: string
  question: string
  status: CvQuestionStatus
}

export interface CvSummary {
  id: string
  targetRole: string
  status: CvStatus
  currentStep: CvStep | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

export interface Cv extends CvSummary {
  questions: CvQuestion[]
  document: CvDocument | null
  version: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface CvAnswer {
  questionId: string
  answer: string | null
}

type CvExperience = CvDocument['experience'][number]

export type UpdateCvBody = Omit<CvDocument, 'experience'> & {
  version: number
  experience: (Omit<CvExperience, 'bullets'> & {
    bullets: Pick<CvExperience['bullets'][number], 'id' | 'text'>[]
  })[]
}
