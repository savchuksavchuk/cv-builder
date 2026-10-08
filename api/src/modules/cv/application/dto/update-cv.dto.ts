import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  MAX_BULLET_CHARS,
  MAX_FIELD_CHARS,
  MAX_LIST_ITEMS,
  MAX_SUMMARY_CHARS,
} from '../../domain/constants/cv-limits.constants';

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const END_DATE = /^(\d{4}-(0[1-9]|1[0-2])|present)$/;
const Text = (max = MAX_FIELD_CHARS) =>
  applyDecorators(
    ValidateIf((_, value) => value !== null),
    IsString(),
    MaxLength(max),
    ApiProperty({ type: String, nullable: true, maxLength: max }),
  );

const DateField = (pattern: RegExp, hint: string) =>
  applyDecorators(
    ValidateIf((_, value) => value !== null),
    Matches(pattern, { message: `date must be ${hint} or null` }),
    ApiProperty({ type: String, nullable: true, description: hint }),
  );

const List = () => applyDecorators(IsArray(), ArrayMaxSize(MAX_LIST_ITEMS));

export class HeaderDto {
  @Text() fullName: string | null;
  @Text() email: string | null;
  @Text() phone: string | null;
  @Text() location: string | null;

  @ApiProperty({ type: [String] })
  @List()
  @IsString({ each: true })
  @MaxLength(MAX_FIELD_CHARS, { each: true })
  links: string[];
}

export class BulletDto {
  @ApiPropertyOptional({ description: 'Omit for a new bullet' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ maxLength: MAX_BULLET_CHARS })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_BULLET_CHARS)
  text: string;
}

export class ExperienceDto {
  @ApiPropertyOptional({ description: 'Omit for a new entry' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Text() company: string | null;
  @Text() title: string | null;
  @Text() location: string | null;
  @DateField(YEAR_MONTH, 'YYYY-MM') startDate: string | null;
  @DateField(END_DATE, 'YYYY-MM or "present"') endDate: string | null;

  @ApiProperty({ type: [BulletDto] })
  @List()
  @ValidateNested({ each: true })
  @Type(() => BulletDto)
  bullets: BulletDto[];
}

export class EducationDto {
  @ApiPropertyOptional({ description: 'Omit for a new entry' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Text() institution: string | null;
  @Text() degree: string | null;
  @Text() fieldOfStudy: string | null;
  @DateField(YEAR_MONTH, 'YYYY-MM') startDate: string | null;
  @DateField(END_DATE, 'YYYY-MM or "present"') endDate: string | null;
}

export class CertificationDto {
  @ApiPropertyOptional({ description: 'Omit for a new entry' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Text() name: string | null;
  @Text() issuer: string | null;
  @DateField(YEAR_MONTH, 'YYYY-MM') issueDate: string | null;
}

export class UpdateCvDto {
  @ApiProperty({ description: 'CV version the edit is based on' })
  @IsInt()
  @Min(1)
  version: number;

  @ApiPropertyOptional({ type: HeaderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HeaderDto)
  header?: HeaderDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @Text(MAX_SUMMARY_CHARS)
  summary?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @List()
  @IsString({ each: true })
  @MaxLength(MAX_FIELD_CHARS, { each: true })
  skills?: string[];

  @ApiPropertyOptional({ type: [ExperienceDto] })
  @IsOptional()
  @List()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @ApiPropertyOptional({ type: [EducationDto] })
  @IsOptional()
  @List()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @ApiPropertyOptional({ type: [CertificationDto] })
  @IsOptional()
  @List()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];
}
