import { PaginatedResponseDTO } from '../../../../common/dto/paginated-response.dto';
import { CvSummaryResponseDTO } from './cv-summary-response.dto';

export class CvListResponseDTO extends PaginatedResponseDTO(
  CvSummaryResponseDTO,
) {}
