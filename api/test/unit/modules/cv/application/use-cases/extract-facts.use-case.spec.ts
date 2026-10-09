import { ResultBuilder } from '../../../../../../src/common/classes/result.class';
import {
  GenerateObjectRequest,
  LlmService,
} from '../../../../../../src/modules/shared/services/llm.service';
import type { TransactionService } from '../../../../../../src/modules/shared/services/transaction.service';
import { Cv } from '../../../../../../src/modules/cv/domain/entities/cv.entity';
import type { CvRepository } from '../../../../../../src/modules/cv/domain/repositories/cv.repository';
import { CvStatus } from '../../../../../../src/modules/cv/domain/types/cv-status';
import { CvStep } from '../../../../../../src/modules/cv/domain/types/cv-step';
import type { CvJobsPort } from '../../../../../../src/modules/cv/application/ports/cv-jobs.port';
import { ExtractFactsUseCase } from '../../../../../../src/modules/cv/application/use-cases/extract-facts.use-case';
import {
  INJECTION,
  INJECTION_MARKER,
  withoutUntrustedBlocks,
} from '../../../../../helpers/untrusted-blocks';

jest.mock(
  '../../../../../../src/modules/shared/services/transaction.service',
  () => ({
    TransactionService: class {},
  }),
);

class FakeLlm extends LlmService {
  prompts: string[] = [];

  generateObject<T>(request: GenerateObjectRequest<T>) {
    this.prompts.push(request.prompt);

    const noFacts = { facts: [] } as T;
    return Promise.resolve(
      new ResultBuilder<T>().setSuccess(true).setDto(noFacts).build(),
    );
  }
}

describe('ExtractFactsUseCase', () => {
  const cvs = { save: jest.fn() } as unknown as CvRepository;
  const jobs = {
    enqueueStep: jest.fn().mockResolvedValue({ success: true }),
  } as unknown as CvJobsPort;
  const transaction = {
    run: (work: () => Promise<void>) => work(),
  } as unknown as TransactionService;

  function cvWithInput(userInput: string): Cv {
    const cv = Cv.create('user-1', 'Engineer', userInput, null);
    cv.status = CvStatus.Processing;
    cv.currentStep = CvStep.ExtractFacts;
    return cv;
  }

  it('sends the user input to the model only inside an untrusted block', async () => {
    const llm = new FakeLlm();
    const useCase = new ExtractFactsUseCase(cvs, jobs, llm, transaction);
    const cv = cvWithInput(INJECTION);

    await useCase.execute(cv);

    expect(llm.prompts).toHaveLength(1);
    expect(llm.prompts[0]).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(llm.prompts[0])).not.toContain(
      INJECTION_MARKER,
    );
  });
});
