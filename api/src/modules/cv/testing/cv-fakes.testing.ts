import { Result, ResultBuilder } from '../../../common/classes/result.class';
import { Page } from '../../../common/types/page.type';
import { Cv } from '../domain/entities/cv.entity';
import { CvRepository } from '../domain/repositories/cv.repository';
import { CvStatus } from '../domain/types/cv-status';
import { CvStep } from '../domain/types/cv-step';
import { FactField, FactSection } from '../domain/types/fact';
import { QuestionStatus } from '../domain/types/question';
import { CvJobsPort } from '../application/ports/cv-jobs.port';

export class InMemoryCvRepository implements CvRepository {
  private readonly cvs = new Map<string, Cv>();

  add(cv: Cv): Cv {
    this.cvs.set(cv.id, cv);
    return cv;
  }

  findById(id: string): Promise<Cv | null> {
    return Promise.resolve(this.cvs.get(id) ?? null);
  }

  findByIdForUser(id: string, userId: string): Promise<Cv | null> {
    const cv = this.cvs.get(id);
    return Promise.resolve(cv?.userId === userId ? cv : null);
  }

  listForUser(
    userId: string,
    { offset, limit }: { offset: number; limit: number },
  ): Promise<Page<Cv>> {
    const own = [...this.cvs.values()].filter((cv) => cv.userId === userId);
    return Promise.resolve({
      items: own.slice(offset, offset + limit),
      total: own.length,
    });
  }

  save(cv: Cv): Promise<void> {
    this.cvs.set(cv.id, cv);
    return Promise.resolve();
  }
}

export class FakeCvJobs implements CvJobsPort {
  readonly enqueued: { cvId: string; step: CvStep }[] = [];

  enqueueStep(cvId: string, step: CvStep): Promise<Result> {
    this.enqueued.push({ cvId, step });
    return Promise.resolve(new ResultBuilder().setSuccess(true).build());
  }
}

export function completedCv(userId: string): Cv {
  const cv = Cv.create(userId, 'Backend Engineer', 'my background', null);
  cv.status = CvStatus.Completed;
  cv.document = {
    header: {
      fullName: 'Jane Doe',
      email: null,
      phone: null,
      location: null,
      links: [],
    },
    summary: 'Original summary',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  };
  return cv;
}

export const OPEN_QUESTION_ID = 'q1';

export function cvWaitingForAnswers(userId: string): Cv {
  const cv = Cv.create(userId, 'Backend Engineer', 'my background', null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.AnswerQuestions;
  cv.questions = [
    {
      id: OPEN_QUESTION_ID,
      target: {
        section: FactSection.Contacts,
        entryId: 'contacts',
        field: FactField.Email,
      },
      question: 'What is your email?',
      status: QuestionStatus.Open,
      answer: null,
      createdAt: '',
      updatedAt: '',
    },
  ];
  return cv;
}
