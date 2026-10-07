import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type, plainToInstance } from 'class-transformer';
import { CvSnapshot } from '../../domain/entities/cv.entity';
import { CvStatus } from '../../domain/types/cv-status';
import { CvStep } from '../../domain/types/cv-step';
import { QuestionStatus } from '../../domain/types/question';

export class QuestionResponseDTO {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  question: string;

  @ApiProperty({ enum: QuestionStatus })
  @Expose()
  status: QuestionStatus;
}

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

  @ApiProperty({
    type: [QuestionResponseDTO],
    description: 'Open questions waiting for answers',
  })
  @Expose()
  @Type(() => QuestionResponseDTO)
  questions: QuestionResponseDTO[];

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
    return plainToInstance(
      CvResponseDTO,
      {
        ...cv,
        questions: cv.questions.filter((q) => q.status === QuestionStatus.Open),
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
