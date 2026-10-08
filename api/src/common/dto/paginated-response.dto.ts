import { Type as ClassType } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export function PaginatedResponseDTO<T>(itemDto: ClassType<T>) {
  class PaginatedResponse {
    @ApiProperty({ type: [itemDto] })
    @Expose()
    @Type(() => itemDto)
    items: T[];

    @ApiProperty()
    @Expose()
    total: number;

    @ApiProperty()
    @Expose()
    page: number;

    @ApiProperty()
    @Expose()
    limit: number;
  }

  return PaginatedResponse;
}
