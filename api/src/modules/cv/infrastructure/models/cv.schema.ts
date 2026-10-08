import { EntitySchema } from '@mikro-orm/core';
import { MAX_TARGET_ROLE_CHARS } from '../../domain/constants/cv-limits.constants';
import { Cv } from '../../domain/entities/cv.entity';
import { CvDocument } from '../../domain/types/cv-document';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { Fact } from '../../domain/types/fact';
import { Question } from '../../domain/types/question';

export interface CvModel {
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
}

export class CvSchema extends EntitySchema<CvModel> {
  constructor() {
    super({
      name: 'CvModel',
      tableName: 'cvs',
      properties: {
        id: { type: 'uuid', primary: true },
        userId: {
          kind: 'm:1',
          entity: (() => 'UserModel') as never,
          mapToPk: true,
          fieldName: 'user_id',
          deleteRule: 'cascade',
          index: true,
        },
        targetRole: { type: 'string', length: MAX_TARGET_ROLE_CHARS },
        status: { type: 'string' },
        currentStep: { type: 'string', nullable: true },
        failureReason: { type: 'text', nullable: true },
        initialUserInput: { type: 'text' },
        sourceFileKey: { type: 'string', nullable: true },
        document: { type: 'json', nullable: true },
        facts: { type: 'json', defaultRaw: "'[]'" },
        questions: { type: 'json' },
        questionRounds: { type: 'number', default: 0 },
        composeRegenerations: { type: 'number', default: 0 },
        composeFeedback: { type: 'json', defaultRaw: "'[]'" },
        version: { type: 'number', version: true },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
      },
    });
  }

  fromDomain(cv: Cv): CvModel {
    return { ...cv.getSnapshot() };
  }

  toDomain(model: CvModel): Cv {
    const cv = new Cv();
    cv.id = model.id;
    cv.userId = model.userId;
    cv.targetRole = model.targetRole;
    cv.status = model.status;
    cv.currentStep = model.currentStep;
    cv.failureReason = model.failureReason;
    cv.initialUserInput = model.initialUserInput;
    cv.sourceFileKey = model.sourceFileKey;
    cv.document = model.document;
    cv.facts = model.facts;
    cv.questions = model.questions;
    cv.questionRounds = model.questionRounds;
    cv.composeRegenerations = model.composeRegenerations;
    cv.composeFeedback = model.composeFeedback;
    cv.version = model.version;
    cv.createdAt = model.createdAt;
    cv.updatedAt = model.updatedAt;
    return cv;
  }
}

export const cvSchema = new CvSchema();
