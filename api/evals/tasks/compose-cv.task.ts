import { ComposeCvUseCase } from '../../src/modules/cv/application/use-cases/compose-cv.use-case';
import { Cv } from '../../src/modules/cv/domain/entities/cv.entity';
import { CvDocument } from '../../src/modules/cv/domain/types/cv-document';
import { CvStatus } from '../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../src/modules/cv/domain/types/cv-step';
import {
  FakeCvJobs,
  InMemoryCvRepository,
} from '../../src/modules/cv/testing/cv-fakes.testing';
import type { Candidate } from '../datasets/candidates';
import { runWithoutTransaction } from './no-transaction';
import { productLlm } from './product-llm';

function cvWaitingForComposition(candidate: Candidate): Cv {
  const cv = Cv.create('eval-user', candidate.targetRole, '', null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.ComposeCv;
  cv.facts = candidate.facts;

  return cv;
}

function realComposeStep(): ComposeCvUseCase {
  return new ComposeCvUseCase(
    new InMemoryCvRepository(),
    new FakeCvJobs(),
    productLlm(),
    runWithoutTransaction,
  );
}

export async function composeCv(candidate: Candidate): Promise<CvDocument> {
  const cv = cvWaitingForComposition(candidate);

  await realComposeStep().execute(cv);

  if (!cv.document) {
    throw new Error('The compose step produced no document');
  }

  return cv.document;
}
