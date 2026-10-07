import { randomUUID } from 'node:crypto';
import { Result, ResultBuilder } from '../../../../common/classes/result.class';
import { MAX_INPUT_CHARS } from '../constants/cv-limits.constants';
import { GENERATION_STEPS } from '../constants/cv-pipeline.constants';
import { normalizeText } from '../utils/normalize-text';
import { Certification } from '../types/certification';
import { Contacts } from '../types/contacts';
import { CvStatus } from '../types/cv-status';
import { CvStep } from '../types/cv-step';
import { Education } from '../types/education';
import { Question } from '../types/question';
import { Summary } from '../types/summary';
import { WorkExperience } from '../types/work-experience';

export type CvSnapshot = Readonly<{
  id: string;
  userId: string;
  targetRole: string;
  status: CvStatus;
  currentStep: CvStep | null;
  failureReason: string | null;
  initialUserInput: string;
  sourceFileKey: string | null;
  contacts: Contacts | null;
  summary: Summary | null;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  questions: Question[];
  questionRounds: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export class Cv {
  id: string;
  userId: string;
  targetRole: string;
  status: CvStatus;
  currentStep: CvStep | null;
  failureReason: string | null;
  initialUserInput: string;
  sourceFileKey: string | null;
  contacts: Contacts | null;
  summary: Summary | null;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  questions: Question[];
  questionRounds: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  static create(
    userId: string,
    targetRole: string,
    rawText: string,
    sourceFileKey: string | null,
  ): Cv {
    const now = new Date();
    const cv = new Cv();
    cv.id = randomUUID();
    cv.userId = userId;
    cv.targetRole = targetRole.trim();
    cv.status = CvStatus.Initial;
    cv.currentStep = null;
    cv.failureReason = null;
    cv.initialUserInput = normalizeText(rawText);
    cv.sourceFileKey = sourceFileKey;
    cv.contacts = null;
    cv.summary = null;
    cv.workExperience = [];
    cv.education = [];
    cv.certifications = [];
    cv.questions = [];
    cv.questionRounds = 0;
    cv.version = 1;
    cv.createdAt = now;
    cv.updatedAt = now;
    return cv;
  }

  setProcessingState(): Result {
    const builder = new ResultBuilder();

    if (this.status !== CvStatus.Initial) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is ${this.status}, expected ${CvStatus.Initial}`)
        .build();
    }

    this.status = CvStatus.Processing;
    this.touch();

    return builder.setSuccess(true).build();
  }

  setExtractingFileStep(): Result<CvStep> {
    const builder = new ResultBuilder<CvStep>();

    if (this.status !== CvStatus.Processing) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is ${this.status}, expected ${CvStatus.Processing}`)
        .build();
    }

    if (!this.sourceFileKey) {
      return builder.setSuccess(false).setMessage('CV has no PDF file').build();
    }

    this.currentStep = CvStep.ParsePdf;
    this.touch();

    return builder.setSuccess(true).setDto(CvStep.ParsePdf).build();
  }

  setExtractingFactsStep(): Result<CvStep> {
    const builder = new ResultBuilder<CvStep>();

    if (this.status !== CvStatus.Processing) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is ${this.status}, expected ${CvStatus.Processing}`)
        .build();
    }

    this.currentStep = CvStep.ExtractFacts;
    this.touch();

    return builder.setSuccess(true).setDto(CvStep.ExtractFacts).build();
  }

  isBeforeStep(step: CvStep): boolean {
    return (
      this.currentStep !== null &&
      GENERATION_STEPS.indexOf(this.currentStep) <
        GENERATION_STEPS.indexOf(step)
    );
  }

  finishStep(step: CvStep): Result {
    const builder = new ResultBuilder();

    if (this.status !== CvStatus.Processing || this.currentStep !== step) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${step}`)
        .build();
    }

    const next = GENERATION_STEPS[GENERATION_STEPS.indexOf(step) + 1];

    if (next) {
      this.currentStep = next;
    } else {
      this.status = CvStatus.Completed;
      this.currentStep = null;
    }
    this.touch();

    return builder.setSuccess(true).build();
  }

  applyPdfText(pdfText: string): Result {
    const builder = new ResultBuilder();

    const text = normalizeText(
      [pdfText, this.initialUserInput].filter(Boolean).join('\n\n'),
    );
    if (text.length > MAX_INPUT_CHARS) {
      return builder
        .setSuccess(false)
        .setMessage(`Input is longer than ${MAX_INPUT_CHARS} characters`)
        .build();
    }

    this.initialUserInput = text;
    this.sourceFileKey = null;
    this.touch();

    return builder.setSuccess(true).build();
  }

  fail(reason: string): Result {
    const builder = new ResultBuilder();

    if (this.status !== CvStatus.Processing) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is ${this.status}, expected ${CvStatus.Processing}`)
        .build();
    }

    this.status = CvStatus.Failed;
    this.failureReason = reason;
    this.touch();

    return builder.setSuccess(true).build();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  getSnapshot(): CvSnapshot {
    return structuredClone({
      id: this.id,
      userId: this.userId,
      targetRole: this.targetRole,
      status: this.status,
      currentStep: this.currentStep,
      failureReason: this.failureReason,
      initialUserInput: this.initialUserInput,
      sourceFileKey: this.sourceFileKey,
      contacts: this.contacts,
      summary: this.summary,
      workExperience: this.workExperience,
      education: this.education,
      certifications: this.certifications,
      questions: this.questions,
      questionRounds: this.questionRounds,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
