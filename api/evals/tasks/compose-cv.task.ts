import type { ConfigService } from '@nestjs/config';
import { ComposeCvUseCase } from '../../src/modules/cv/application/use-cases/compose-cv.use-case';
import { Cv } from '../../src/modules/cv/domain/entities/cv.entity';
import { CvDocument } from '../../src/modules/cv/domain/types/cv-document';
import { CvStatus } from '../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../src/modules/cv/domain/types/cv-step';
import {
  FakeCvJobs,
  InMemoryCvRepository,
} from '../../src/modules/cv/testing/cv-fakes.testing';
import { AnthropicLlmService } from '../../src/modules/shared/services/anthropic-llm.service';
import type { TransactionService } from '../../src/modules/shared/services/transaction.service';
import type { Candidate } from '../datasets/candidates';

export async function composeCv(candidate: Candidate): Promise<CvDocument> {
  const cv = Cv.create('eval-user', candidate.targetRole, '', null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.ComposeCv;
  cv.facts = candidate.facts;

  const config = {
    getOrThrow: () => process.env.ANTHROPIC_API_KEY,
  } as unknown as ConfigService;
  const transaction = {
    run: (work: () => Promise<void>) => work(),
  } as unknown as TransactionService;

  const composeUseCase = new ComposeCvUseCase(
    new InMemoryCvRepository(),
    new FakeCvJobs(),
    new AnthropicLlmService(config),
    transaction,
  );
  await composeUseCase.execute(cv);

  if (!cv.document) {
    throw new Error('Compose step produced no document');
  }

  return cv.document;
}
