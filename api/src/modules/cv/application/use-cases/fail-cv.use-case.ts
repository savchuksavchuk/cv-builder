import { Inject, Injectable, Logger } from '@nestjs/common';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { FILE_STORAGE_PORT } from '../ports/file-storage.port';
import type { FileStoragePort } from '../ports/file-storage.port';

@Injectable()
export class FailCvUseCase {
  private readonly logger = new Logger(FailCvUseCase.name);

  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(FILE_STORAGE_PORT) private readonly files: FileStoragePort,
  ) {}

  async execute(cvId: string): Promise<void> {
    const cv = await this.cvs.findById(cvId);

    if (!cv) {
      return;
    }

    const fileKey = cv.sourceFileKey;

    const failed = cv.fail(
      `Generation failed at step ${cv.currentStep ?? 'start'}`,
    );
    if (!failed.success) {
      return;
    }

    await this.cvs.save(cv, { flush: true });

    if (fileKey) {
      const deleted = await this.files.delete(fileKey);
      if (!deleted.success) {
        this.logger.warn(
          `Could not delete file ${fileKey}: ${deleted.message}`,
        );
      }
    }
  }
}
