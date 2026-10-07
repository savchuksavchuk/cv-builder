import { randomUUID } from 'node:crypto';
import { normalizeText } from '../utils/normalize-text';
import { Certification } from '../types/certification';
import { Contacts } from '../types/contacts';
import { CvStatus } from '../types/cv-status';
import { CvStep } from '../types/cv-step';
import { Education } from '../types/education';
import { Question } from '../types/question';
import { Summary } from '../types/summary';
import { WorkExperience } from '../types/work-experience';

export type CvSnapshot = Readonly<Omit<Cv, 'getSnapshot'>>;

export class Cv {
  id!: string;
  userId!: string;
  targetRole!: string;
  status!: CvStatus;
  currentStep!: CvStep | null;
  failureReason!: string | null;
  initialUserInput!: string;
  contacts!: Contacts | null;
  summary!: Summary | null;
  workExperience!: WorkExperience[];
  education!: Education[];
  certifications!: Certification[];
  questions!: Question[];
  version!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static create(userId: string, targetRole: string, rawText: string): Cv {
    const now = new Date();
    const cv = new Cv();
    cv.id = randomUUID();
    cv.userId = userId;
    cv.targetRole = targetRole.trim();
    cv.status = CvStatus.Queued;
    cv.currentStep = null;
    cv.failureReason = null;
    cv.initialUserInput = normalizeText(rawText);
    cv.contacts = null;
    cv.summary = null;
    cv.workExperience = [];
    cv.education = [];
    cv.certifications = [];
    cv.questions = [];
    cv.version = 1;
    cv.createdAt = now;
    cv.updatedAt = now;
    return cv;
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
      contacts: this.contacts,
      summary: this.summary,
      workExperience: this.workExperience,
      education: this.education,
      certifications: this.certifications,
      questions: this.questions,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
