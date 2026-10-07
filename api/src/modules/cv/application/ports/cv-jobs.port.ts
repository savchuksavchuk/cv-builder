import { Result } from '../../../../common/classes/result.class';
import { CvStep } from '../../domain/types/cv-step';

export interface CvJobsPort {
  enqueueStep(cvId: string, step: CvStep): Promise<Result>;
}

export const CV_JOBS_PORT = Symbol('CV_JOBS_PORT');
