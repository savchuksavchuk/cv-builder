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
import { normalizeText } from '../utils/normalize-text';
import { Review } from '../utils/document/review-document';
import { verifyFacts } from '../utils/facts/verify-facts';
import { CvDocument, CvDocumentPatch } from '../types/cv-document';
import { CvStatus } from '../types/cv-status';
import { CvStep } from '../types/cv-step';
import { Fact, INITIAL_USER_INPUT_SOURCE } from '../types/fact';
import { Question, QuestionDraft, QuestionStatus } from '../types/question';

export type CvSnapshot = Readonly<{
  id: string;
  userId: string;
  targetRole: string;
  status: CvStatus;
  currentStep: CvStep | null;
  failureReason: string | null;
  initialUserInput: string;
  sourceFileKey: string | null;
  document: CvDocument | null;
  facts: Fact[];
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
  document: CvDocument | null;
  facts: Fact[];
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
    cv.document = null;
    cv.facts = [];
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

  applyExtractedFacts(facts: Fact[]): Result {
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

    this.facts = facts;
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

    this.facts = verifyFacts(this.facts, (source) =>
      source === INITIAL_USER_INPUT_SOURCE
        ? this.initialUserInput
        : (this.questions.find((q) => q.id === source)?.answer ?? null),
    );
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
          target: draft.target,
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

  applyAnswers(facts: Fact[]): Result {
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

    this.facts = facts;

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

  applyReview({ feedback, safeDocument }: Review): Result {
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

    if (
      feedback.length &&
      this.composeRegenerations < MAX_COMPOSE_REGENERATIONS
    ) {
      this.composeRegenerations += 1;
      this.composeFeedback = feedback;
      this.currentStep = CvStep.ComposeCv;
    } else {
      this.document = safeDocument;
      this.composeFeedback = [];
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

  editDocument(version: number, patch: CvDocumentPatch): Result {
    const builder = new ResultBuilder();

    if (this.status !== CvStatus.Completed || !this.document) {
      return builder
        .setSuccess(false)
        .setMessage('CV is not completed')
        .build();
    }

    if (version !== this.version) {
      return builder
        .setSuccess(false)
        .setMessage('CV was modified, reload it')
        .build();
    }

    const doc = this.document;
    const clean = (value: string | null) => value?.trim() || null;
    const ids = idResolver(
      [...doc.experience, ...doc.education, ...doc.certifications].map(
        (item) => item.id,
      ),
    );
    const sourceIds = new Map(
      doc.experience.flatMap((job) =>
        job.bullets.map((bullet) => [bullet.id, bullet.sourceIds]),
      ),
    );
    const bulletIds = idResolver([...sourceIds.keys()]);

    if (patch.header) {
      const { links, ...fields } = patch.header;
      doc.header = {
        fullName: clean(fields.fullName),
        email: clean(fields.email),
        phone: clean(fields.phone),
        location: clean(fields.location),
        links: [...new Set(links.map((l) => l.trim()).filter(Boolean))],
      };
    }
    if (patch.summary !== undefined) {
      doc.summary = clean(patch.summary);
    }
    if (patch.skills) {
      doc.skills = [
        ...new Set(patch.skills.map((s) => s.trim()).filter(Boolean)),
      ];
    }
    if (patch.experience) {
      doc.experience = patch.experience.map((job) => ({
        id: ids(job.id),
        company: clean(job.company),
        title: clean(job.title),
        location: clean(job.location),
        startDate: job.startDate,
        endDate: job.endDate,
        bullets: job.bullets
          .map((bullet) => ({ ...bullet, text: bullet.text.trim() }))
          .filter((bullet) => bullet.text)
          .map((bullet) => {
            const id = bulletIds(bullet.id);
            return {
              id,
              text: bullet.text,
              sourceIds: sourceIds.get(id) ?? [],
            };
          }),
      }));
    }
    if (patch.education) {
      doc.education = patch.education.map((item) => ({
        id: ids(item.id),
        institution: clean(item.institution),
        degree: clean(item.degree),
        fieldOfStudy: clean(item.fieldOfStudy),
        startDate: item.startDate,
        endDate: item.endDate,
      }));
    }
    if (patch.certifications) {
      doc.certifications = patch.certifications.map((item) => ({
        id: ids(item.id),
        name: clean(item.name),
        issuer: clean(item.issuer),
        issueDate: item.issueDate,
      }));
    }

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
      document: this.document,
      facts: this.facts,
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

// Keeps a client id only if it is known and not used yet; otherwise a new one.
function idResolver(known: string[]): (id?: string) => string {
  const available = new Set(known);

  return (id) => {
    if (id && available.delete(id)) {
      return id;
    }
    return randomUUID();
  };
}
