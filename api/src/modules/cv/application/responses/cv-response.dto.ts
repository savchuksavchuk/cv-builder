import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { CvSnapshot } from '../../domain/entities/cv.entity';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';

export class CvResponseDTO {
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
  version: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static toResponse(cv: CvSnapshot): CvResponseDTO {
    return plainToInstance(CvResponseDTO, cv, {
      excludeExtraneousValues: true,
    });
  }
}
