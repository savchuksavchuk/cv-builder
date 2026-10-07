import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { MAX_INPUT_CHARS } from '../../domain/constants/cv-limits.constants';
import { InitCvDto } from '../dto/init-cv.dto';
import { PDF_TEXT_PORT } from '../ports/pdf-text.port';
import type { PdfTextPort } from '../ports/pdf-text.port';
import { InitCvResponseDTO } from '../responses/init-cv-response.dto';

@Injectable()
export class InitCvUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(PDF_TEXT_PORT) private readonly pdfText: PdfTextPort,
  ) {}

  async execute(userId: string, dto: InitCvDto, file?: Express.Multer.File) {
    const text = await this.buildInputText(dto, file);

    const cv = Cv.create(userId, dto.targetRole, text);

    const started = cv.startGeneration();

    if (!started.success) {
      throw new ConflictException(started.message);
    }

    await this.cvs.save(cv, { flush: true });

    return InitCvResponseDTO.toResponse(cv.getSnapshot());
  }

  private async buildInputText(
    dto: InitCvDto,
    file?: Express.Multer.File,
  ): Promise<string> {
    const parts: string[] = [];

    if (file) {
      parts.push(await this.textFromPdf(file));
    }

    if (dto.text) {
      parts.push(dto.text);
    }

    if (!parts.length) {
      throw new BadRequestException('Provide text, a PDF file, or both');
    }

    const text = parts.join('\n\n');

    if (text.length > MAX_INPUT_CHARS) {
      throw new BadRequestException(
        `Input is longer than ${MAX_INPUT_CHARS} characters`,
      );
    }

    return text;
  }

  private async textFromPdf(file: Express.Multer.File): Promise<string> {
    const extracted = await this.pdfText.extractText(file.buffer);

    if (!extracted.success || !extracted.dto) {
      throw new BadRequestException(extracted.message);
    }
    return extracted.dto;
  }
}
