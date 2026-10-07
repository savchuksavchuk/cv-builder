import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TransactionService } from '../../../shared/services/transaction.service';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStep } from '../../domain/types/cv-step';
import { SubmitAnswersDto } from '../dto/submit-answers.dto';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';
import { CvResponseDTO } from '../responses/cv-response.dto';

@Injectable()
export class SubmitAnswersUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    private readonly transaction: TransactionService,
  ) {}

  async execute(
    userId: string,
    cvId: string,
    dto: SubmitAnswersDto,
  ): Promise<CvResponseDTO> {
    const cv = await this.cvs.findByIdForUser(cvId, userId);

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const submitted = cv.submitAnswers(dto.answers);

    if (!submitted.success) {
      throw new ConflictException(submitted.message);
    }

    await this.transaction.run(async () => {
      await this.cvs.save(cv, { flush: true });

      const queued = await this.jobs.enqueueStep(cv.id, CvStep.ApplyAnswers);
      if (!queued.success) {
        throw new ServiceUnavailableException('Could not continue generation');
      }
    });

    return CvResponseDTO.toResponse(cv.getSnapshot());
  }
}
