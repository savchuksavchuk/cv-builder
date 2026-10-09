import { MAX_COMPOSE_REGENERATIONS } from '../constants/cv-limits.constants';
import { CvDocument } from '../types/cv-document';
import { CvStatus } from '../types/cv-status';
import { CvStep } from '../types/cv-step';
import { Cv } from './cv.entity';

const safeDocument = { summary: 'safe' } as CvDocument;

const validating = (): Cv => {
  const cv = Cv.create('user', 'Backend Engineer', 'text', null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.ValidateResult;
  cv.document = { summary: 'draft' } as CvDocument;
  return cv;
};

describe('Cv.applyReview', () => {
  it('sends feedback back to composition while regenerations remain', () => {
    const cv = validating();

    const result = cv.applyReview({ feedback: ['bad bullet'], safeDocument });

    expect(result.success).toBe(true);
    expect(cv.currentStep).toBe(CvStep.ComposeCv);
    expect(cv.composeFeedback).toEqual(['bad bullet']);
    expect(cv.composeRegenerations).toBe(1);
    expect(cv.document).toEqual({ summary: 'draft' });
  });

  it('completes with the safe document once regenerations are used up', () => {
    const cv = validating();
    cv.composeRegenerations = MAX_COMPOSE_REGENERATIONS;

    cv.applyReview({ feedback: ['bad bullet'], safeDocument });

    expect(cv.status).toBe(CvStatus.Completed);
    expect(cv.currentStep).toBeNull();
    expect(cv.document).toBe(safeDocument);
    expect(cv.composeFeedback).toEqual([]);
  });

  it('completes without feedback', () => {
    const cv = validating();
    cv.composeFeedback = ['old'];

    cv.applyReview({ feedback: [], safeDocument });

    expect(cv.status).toBe(CvStatus.Completed);
    expect(cv.composeFeedback).toEqual([]);
    expect(cv.composeRegenerations).toBe(0);
  });

  it('refuses to review outside the validation step', () => {
    const cv = validating();
    cv.currentStep = CvStep.ComposeCv;

    expect(cv.applyReview({ feedback: [], safeDocument }).success).toBe(false);
  });
});
