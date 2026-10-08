import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { CvSnapshot } from '../../domain/entities/cv.entity';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';

export class CvSummaryResponseDTO {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  targetRole: string;

  @ApiProperty({ enum: CvStatus })
  @Expose()
  status: CvStatus;

  @ApiProperty({ enum: CvStep, nullable: true })
  @Expose()
  currentStep: CvStep | null;

  @ApiProperty({ nullable: true })
  @Expose()
  failureReason: string | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static toResponse(cv: CvSnapshot): CvSummaryResponseDTO {
    return plainToInstance(CvSummaryResponseDTO, cv, {
      excludeExtraneousValues: true,
    });
  }
}
