import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  MAX_INPUT_CHARS,
  MAX_TARGET_ROLE_CHARS,
} from '../../domain/constants/cv-limits.constants';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class InitCvDto {
  @ApiProperty({
    example: 'Senior Backend Engineer',
    maxLength: MAX_TARGET_ROLE_CHARS,
  })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TARGET_ROLE_CHARS)
  targetRole: string;

  @ApiPropertyOptional({
    description:
      'Free text about the background. Can be sent together with a PDF',
    maxLength: MAX_INPUT_CHARS,
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(MAX_INPUT_CHARS)
  text?: string;
}
