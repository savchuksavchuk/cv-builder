import { EntitySchema } from '@mikro-orm/core';
import { Cv } from '../../domain/entities/cv.entity';
import { Certification } from '../../domain/types/certification';
import { Contacts } from '../../domain/types/contacts';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { Education } from '../../domain/types/education';
import { Question } from '../../domain/types/question';
import { Summary } from '../../domain/types/summary';
import { WorkExperience } from '../../domain/types/work-experience';

export interface CvModel {
  id: string;
  userId: string;
  targetRole: string;
  status: CvStatus;
  currentStep: CvStep | null;
  failureReason: string | null;
  initialUserInput: string;
  contacts: Contacts | null;
  summary: Summary | null;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  questions: Question[];
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
        targetRole: { type: 'string', length: 120 },
        status: { type: 'string' },
        currentStep: { type: 'string', nullable: true },
        failureReason: { type: 'text', nullable: true },
        initialUserInput: { type: 'text' },
        contacts: { type: 'json', nullable: true },
        summary: { type: 'json', nullable: true },
        workExperience: { type: 'json' },
        education: { type: 'json' },
        certifications: { type: 'json' },
        questions: { type: 'json' },
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
    cv.contacts = model.contacts;
    cv.summary = model.summary;
    cv.workExperience = model.workExperience;
    cv.education = model.education;
    cv.certifications = model.certifications;
    cv.questions = model.questions;
    cv.version = model.version;
    cv.createdAt = model.createdAt;
    cv.updatedAt = model.updatedAt;
    return cv;
  }
}

export const cvSchema = new CvSchema();
