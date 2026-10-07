import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  MAX_ANSWER_CHARS,
  MAX_QUESTIONS_PER_ROUND,
} from '../../domain/constants/cv-limits.constants';

export class AnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty({
    type: String,
    nullable: true,
    maxLength: MAX_ANSWER_CHARS,
    description: 'null or an empty string skips the question',
  })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(MAX_ANSWER_CHARS)
  answer: string | null;
}

export class SubmitAnswersDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_QUESTIONS_PER_ROUND)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
