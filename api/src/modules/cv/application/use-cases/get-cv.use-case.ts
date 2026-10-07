import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvResponseDTO } from '../responses/cv-response.dto';

@Injectable()
export class GetCvUseCase {
  constructor(@Inject(CV_REPOSITORY) private readonly cvs: CvRepository) {}

  async execute(userId: string, cvId: string): Promise<CvResponseDTO> {
    const cv = await this.cvs.findByIdForUser(cvId, userId);

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    return CvResponseDTO.toResponse(cv.getSnapshot());
  }
}
