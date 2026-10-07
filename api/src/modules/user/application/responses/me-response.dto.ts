import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { UserSnapshot } from '../../domain/entities/user.entity';

export class MeResponseDTO {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  email!: string;

  static toResponse(user: UserSnapshot): MeResponseDTO {
    return plainToInstance(MeResponseDTO, user, {
      excludeExtraneousValues: true,
    });
  }
}
