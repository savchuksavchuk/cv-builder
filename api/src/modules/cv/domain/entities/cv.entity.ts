import { randomUUID } from 'node:crypto';
import { Result, ResultBuilder } from '../../../../common/classes/result.class';
import {
  MAX_INPUT_CHARS,
  MAX_QUESTION_ROUNDS,
  MAX_COMPOSE_REGENERATIONS,
} from '../constants/cv-limits.constants';
import {
  GENERATION_STEPS,
  NEXT_STEP,
} from '../constants/cv-pipeline.constants';
import { QuestionDraft } from '../utils/question-paths';
import { normalizeText } from '../utils/normalize-text';
import { VerifiableSections, verifySections } from '../utils/verify-evidence';
import { CvDocument } from '../types/cv-document';
import { Certification } from '../types/certification';
import { Contacts } from '../types/contacts';
import { CvStatus } from '../types/cv-status';
import { CvStep } from '../types/cv-step';
import { Education } from '../types/education';
import { INITIAL_USER_INPUT_SOURCE } from '../types/fact';
import { Question, QuestionStatus } from '../types/question';
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
  document: CvDocument | null;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  questions: Question[];
  questionRounds: number;
  composeRegenerations: number;
  composeFeedback: string[];
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
  document: CvDocument | null;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  questions: Question[];
  questionRounds: number;
  composeRegenerations: number;
  composeFeedback: string[];
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
    cv.document = null;
    cv.workExperience = [];
    cv.education = [];
    cv.certifications = [];
    cv.questions = [];
    cv.questionRounds = 0;
    cv.composeRegenerations = 0;
    cv.composeFeedback = [];
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

    const next = NEXT_STEP[step];

    if (next) {
      this.currentStep = next;
    } else {
      this.status = CvStatus.Completed;
      this.currentStep = null;
    }
    this.touch();

    return builder.setSuccess(true).build();
  }

  applyExtractedFacts(sections: {
    contacts: Contacts;
    workExperience: WorkExperience[];
    education: Education[];
    certifications: Certification[];
  }): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.ExtractFacts
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${CvStep.ExtractFacts}`)
        .build();
    }

    this.contacts = sections.contacts;
    this.workExperience = sections.workExperience;
    this.education = sections.education;
    this.certifications = sections.certifications;
    this.touch();

    return builder.setSuccess(true).build();
  }

  verifyEvidence(): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.VerifyEvidence
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${CvStep.VerifyEvidence}`)
        .build();
    }

    const verified = verifySections(
      {
        contacts: this.contacts,
        workExperience: this.workExperience,
        education: this.education,
        certifications: this.certifications,
      },
      (source) =>
        source === INITIAL_USER_INPUT_SOURCE
          ? this.initialUserInput
          : (this.questions.find((q) => q.id === source)?.answer ?? null),
    );

    this.contacts = verified.contacts;
    this.workExperience = verified.workExperience;
    this.education = verified.education;
    this.certifications = verified.certifications;
    this.touch();

    return builder.setSuccess(true).build();
  }

  askQuestions(drafts: QuestionDraft[]): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.GenerateQuestions
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${CvStep.GenerateQuestions}`)
        .build();
    }

    if (!drafts.length || this.questionRounds >= MAX_QUESTION_ROUNDS) {
      this.currentStep = CvStep.ComposeCv;
    } else {
      const now = new Date().toISOString();

      this.questions.push(
        ...drafts.map((draft) => ({
          id: randomUUID(),
          path: draft.path,
          question: draft.question,
          status: QuestionStatus.Open,
          answer: null,
          createdAt: now,
          updatedAt: now,
        })),
      );
      this.questionRounds += 1;
      this.currentStep = CvStep.AnswerQuestions;
    }
    this.touch();

    return builder.setSuccess(true).build();
  }

  submitAnswers(
    answers: { questionId: string; answer: string | null }[],
  ): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.AnswerQuestions
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not waiting for answers`)
        .build();
    }

    const open = this.questions.filter((q) => q.status === QuestionStatus.Open);
    const ids = new Set(answers.map((a) => a.questionId));

    if (
      ids.size !== answers.length ||
      ids.size !== open.length ||
      open.some((q) => !ids.has(q.id))
    ) {
      return builder
        .setSuccess(false)
        .setMessage('Answers must cover each open question exactly once')
        .build();
    }

    const now = new Date().toISOString();
    for (const question of open) {
      const text = normalizeText(
        answers.find((a) => a.questionId === question.id)?.answer ?? '',
      );
      question.answer = text || null;
      question.status = text
        ? QuestionStatus.Answered
        : QuestionStatus.Dismissed;
      question.updatedAt = now;
    }

    this.currentStep = CvStep.ApplyAnswers;
    this.touch();

    return builder.setSuccess(true).build();
  }

  applyAnswers(sections: VerifiableSections): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.ApplyAnswers
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${CvStep.ApplyAnswers}`)
        .build();
    }

    this.contacts = sections.contacts;
    this.workExperience = sections.workExperience;
    this.education = sections.education;
    this.certifications = sections.certifications;

    const now = new Date().toISOString();
    for (const question of this.questions) {
      if (question.status === QuestionStatus.Answered) {
        question.status = QuestionStatus.Applied;
        question.updatedAt = now;
      }
    }
    this.touch();

    return builder.setSuccess(true).build();
  }

  applyComposition(document: CvDocument): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.ComposeCv
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${CvStep.ComposeCv}`)
        .build();
    }

    this.document = document;
    this.touch();

    return builder.setSuccess(true).build();
  }

  applyValidation(document: CvDocument): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.ValidateResult
    ) {
      return builder
        .setSuccess(false)
        .setMessage(`CV is not processing step ${CvStep.ValidateResult}`)
        .build();
    }

    this.document = document;
    this.composeFeedback = [];
    this.touch();

    return builder.setSuccess(true).build();
  }

  rejectComposition(feedback: string[]): Result {
    const builder = new ResultBuilder();

    if (
      this.status !== CvStatus.Processing ||
      this.currentStep !== CvStep.ValidateResult ||
      this.composeRegenerations >= MAX_COMPOSE_REGENERATIONS
    ) {
      return builder
        .setSuccess(false)
        .setMessage('CV composition cannot be regenerated')
        .build();
    }

    this.composeRegenerations += 1;
    this.composeFeedback = feedback;
    this.currentStep = CvStep.ComposeCv;
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
      document: this.document,
      workExperience: this.workExperience,
      education: this.education,
      certifications: this.certifications,
      questions: this.questions,
      questionRounds: this.questionRounds,
      composeRegenerations: this.composeRegenerations,
      composeFeedback: this.composeFeedback,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
