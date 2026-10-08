import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { UpdateCvDto } from '../dto/update-cv.dto';
import { CvResponseDTO } from '../responses/cv-response.dto';

@Injectable()
export class UpdateCvUseCase {
  constructor(@Inject(CV_REPOSITORY) private readonly cvs: CvRepository) {}

  async execute(
    userId: string,
    cvId: string,
    dto: UpdateCvDto,
  ): Promise<CvResponseDTO> {
    const cv = await this.cvs.findByIdForUser(cvId, userId);

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const { version, ...patch } = dto;
    const edited = cv.editDocument(version, patch);

    if (!edited.success) {
      throw new ConflictException(edited.message);
    }

    await this.cvs.save(cv, { flush: true });

    return CvResponseDTO.toResponse(cv.getSnapshot());
  }
}
