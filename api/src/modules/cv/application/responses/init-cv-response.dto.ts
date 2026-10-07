import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { CvSnapshot } from '../../domain/entities/cv.entity';

export class InitCvResponseDTO {
  @ApiProperty()
  @Expose()
  id: string;

  static toResponse(cv: CvSnapshot): InitCvResponseDTO {
    return plainToInstance(InitCvResponseDTO, cv, {
      excludeExtraneousValues: true,
    });
  }
}
