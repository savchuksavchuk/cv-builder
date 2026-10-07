import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { InitCvDto } from '../dto/init-cv.dto';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';
import { FILE_STORAGE_PORT } from '../ports/file-storage.port';
import type { FileStoragePort } from '../ports/file-storage.port';
import { InitCvResponseDTO } from '../responses/init-cv-response.dto';

@Injectable()
export class InitCvUseCase {
  private readonly logger = new Logger(InitCvUseCase.name);

  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    @Inject(FILE_STORAGE_PORT) private readonly files: FileStoragePort,
    private readonly transaction: TransactionService,
  ) {}

  async execute(
    userId: string,
    dto: InitCvDto,
    file?: Express.Multer.File,
  ): Promise<InitCvResponseDTO> {
    if (!file && !dto.text) {
      throw new BadRequestException('Provide text, a PDF file, or both');
    }

    const fileKey = file ? await this.storeFile(file) : null;

    const cv = Cv.create(userId, dto.targetRole, dto.text ?? '', fileKey);

    const started = cv.setProcessingState();

    if (!started.success) {
      await this.deleteFile(fileKey);
      throw new ConflictException(started.message);
    }

    const firstStep = fileKey
      ? cv.setExtractingFileStep()
      : cv.setExtractingFactsStep();

    if (!firstStep.success || !firstStep.dto) {
      await this.deleteFile(fileKey);
      throw new ConflictException(firstStep.message);
    }

    try {
      await this.transaction.run(async () => {
        await this.cvs.save(cv, { flush: true });

        const queued = await this.jobs.enqueueStep(cv.id, firstStep.dto!);

        if (!queued.success) {
          throw new ServiceUnavailableException('Could not start generation');
        }
      });
    } catch (error) {
      await this.deleteFile(fileKey);
      throw error;
    }

    return InitCvResponseDTO.toResponse(cv.getSnapshot());
  }

  private async storeFile(file: Express.Multer.File): Promise<string> {
    const saved = await this.files.save(file.buffer);

    if (!saved.success || !saved.dto) {
      throw new InternalServerErrorException(saved.message);
    }

    return saved.dto;
  }

  private async deleteFile(key: string | null): Promise<void> {
    if (!key) {
      return;
    }

    const deleted = await this.files.delete(key);
    if (!deleted.success) {
      this.logger.warn(`Could not delete file ${key}: ${deleted.message}`);
    }
  }
}
