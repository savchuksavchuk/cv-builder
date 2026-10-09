import { ExtractFactsUseCase } from '../../../src/modules/cv/application/use-cases/extract-facts.use-case';
import { Cv } from '../../../src/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '../../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../../src/modules/cv/domain/types/cv-step';
import { Fact } from '../../../src/modules/cv/domain/types/fact';
import { FakeCvJobs } from '../../fakes/fake-cv-jobs.port-implementation';
import { InMemoryCvRepository } from '../../fakes/in-memory-cv.repository';
import type { CvText } from '../datasets/cv-texts';
import { runWithoutTransaction } from '../../fakes/run-without-transaction';
import { productLlm } from './product-llm';

export type Extraction = {
  extracted: Fact[];
  verified: Fact[];
};

function cvWaitingForExtraction(cvText: CvText): Cv {
  const cv = Cv.create('eval-user', 'any role', cvText.lines.join('\n'), null);
  cv.status = CvStatus.Processing;
  cv.currentStep = CvStep.ExtractFacts;

  return cv;
}

function realExtractStep(): ExtractFactsUseCase {
  return new ExtractFactsUseCase(
    new InMemoryCvRepository(),
    new FakeCvJobs(),
    productLlm(),
    runWithoutTransaction,
  );
}

export async function extractFacts(cvText: CvText): Promise<Extraction> {
  const cv = cvWaitingForExtraction(cvText);

  await realExtractStep().execute(cv);
  const extracted = [...cv.facts];

  const checked = cv.verifyEvidence();
  if (!checked.success) {
    throw new Error(checked.message);
  }

  return { extracted, verified: cv.facts };
}
