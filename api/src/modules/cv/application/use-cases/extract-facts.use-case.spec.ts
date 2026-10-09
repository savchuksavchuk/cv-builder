import { ResultBuilder } from '../../../../common/classes/result.class';
import {
  GenerateObjectRequest,
  LlmService,
} from '../../../shared/services/llm.service';
import type { TransactionService } from '../../../shared/services/transaction.service';
import { Cv } from '../../domain/entities/cv.entity';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import type { CvJobsPort } from '../ports/cv-jobs.port';
import { ExtractFactsUseCase } from './extract-facts.use-case';
import {
  INJECTION,
  INJECTION_MARKER,
  withoutUntrustedBlocks,
} from '../../domain/utils/untrusted/untrusted.testing';

jest.mock('../../../shared/services/transaction.service', () => ({
  TransactionService: class {},
}));

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
