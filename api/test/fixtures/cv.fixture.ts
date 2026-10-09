import { Cv } from '../../src/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../src/modules/cv/domain/types/cv-step';
import { FactField, FactSection } from '../../src/modules/cv/domain/types/fact';
import { QuestionStatus } from '../../src/modules/cv/domain/types/question';

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
