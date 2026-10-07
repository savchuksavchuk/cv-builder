import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../../common/classes/result.class';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Cv } from '../../domain/entities/cv.entity';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStep } from '../../domain/types/cv-step';
import { CV_JOBS_PORT } from '../ports/cv-jobs.port';
import type { CvJobsPort } from '../ports/cv-jobs.port';
import { FILE_STORAGE_PORT } from '../ports/file-storage.port';
import type { FileStoragePort } from '../ports/file-storage.port';
import { PDF_TEXT_PORT } from '../ports/pdf-text.port';
import type { PdfTextPort } from '../ports/pdf-text.port';

@Injectable()
export class ParsePdfUseCase {
  private readonly logger = new Logger(ParsePdfUseCase.name);

  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(CV_JOBS_PORT) private readonly jobs: CvJobsPort,
    @Inject(FILE_STORAGE_PORT) private readonly files: FileStoragePort,
    @Inject(PDF_TEXT_PORT) private readonly pdfText: PdfTextPort,
    private readonly transaction: TransactionService,
  ) {}

  async execute(cv: Cv): Promise<void> {
    const fileKey = cv.sourceFileKey;
    const parsed = await this.parse(cv);

    if (!parsed.success) {
      cv.fail(parsed.message ?? 'PDF could not be processed');
      await this.cvs.save(cv, { flush: true });
      await this.deleteFile(fileKey);
      return;
    }

    const finished = cv.finishStep(CvStep.ParsePdf);
    if (!finished.success) {
      throw new Error(finished.message);
    }

    await this.transaction.run(async () => {
      await this.cvs.save(cv, { flush: true });

      const queued = await this.jobs.enqueueStep(cv.id, cv.currentStep!);
      if (!queued.success) {
        throw new Error(queued.message);
      }
    });

    await this.deleteFile(fileKey);
  }

  private async parse(cv: Cv): Promise<Result> {
    if (!cv.sourceFileKey) {
      return { success: true };
    }

    const file = await this.files.read(cv.sourceFileKey);
    if (!file.success || !file.dto) {
      throw new Error(file.message);
    }

    const extracted = await this.pdfText.extractText(file.dto);
    if (!extracted.success || !extracted.dto) {
      return { success: false, message: extracted.message };
    }

    return cv.applyPdfText(extracted.dto);
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
