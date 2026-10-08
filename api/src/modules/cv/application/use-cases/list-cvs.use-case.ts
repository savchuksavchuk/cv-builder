import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvListResponseDTO } from '../responses/cv-list-response.dto';
import { CvSummaryResponseDTO } from '../responses/cv-summary-response.dto';

@Injectable()
export class ListCvsUseCase {
  constructor(@Inject(CV_REPOSITORY) private readonly cvs: CvRepository) {}

  async execute(
    userId: string,
    { page, limit }: PaginationQueryDto,
  ): Promise<CvListResponseDTO> {
    const { items, total } = await this.cvs.listForUser(userId, {
      offset: (page - 1) * limit,
      limit,
    });

    return {
      items: items.map((cv) =>
        CvSummaryResponseDTO.toResponse(cv.getSnapshot()),
      ),
      total,
      page,
      limit,
    };
  }
}
