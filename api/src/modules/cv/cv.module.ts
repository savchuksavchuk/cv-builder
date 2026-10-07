import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SessionModule } from '../auth/session.module';
import { CV_JOBS_PORT } from './application/ports/cv-jobs.port';
import { FILE_STORAGE_PORT } from './application/ports/file-storage.port';
import { PDF_TEXT_PORT } from './application/ports/pdf-text.port';
import { ExtractFactsUseCase } from './application/use-cases/extract-facts.use-case';
import { ParsePdfUseCase } from './application/use-cases/parse-pdf.use-case';
import { AdvanceCvStepUseCase } from './application/use-cases/advance-cv-step.use-case';
import { FailCvUseCase } from './application/use-cases/fail-cv.use-case';
import { GenerateQuestionsUseCase } from './application/use-cases/generate-questions.use-case';
import { VerifyEvidenceUseCase } from './application/use-cases/verify-evidence.use-case';
import { ApplyAnswersUseCase } from './application/use-cases/apply-answers.use-case';
import { SubmitAnswersUseCase } from './application/use-cases/submit-answers.use-case';
import { GetCvUseCase } from './application/use-cases/get-cv.use-case';
import { InitCvUseCase } from './application/use-cases/init-cv.use-case';
import { CV_REPOSITORY } from './domain/repositories/cv.repository';
import { ApplyAnswersWorker } from './infrastructure/workers/apply-answers.worker';
import { ExtractFactsWorker } from './infrastructure/workers/extract-facts.worker';
import { GenerateQuestionsWorker } from './infrastructure/workers/generate-questions.worker';
import { ParsePdfWorker } from './infrastructure/workers/parse-pdf.worker';
import { TailorToRoleWorker } from './infrastructure/workers/tailor-to-role.worker';
import { VerifyEvidenceWorker } from './infrastructure/workers/verify-evidence.worker';
import { cvSchema } from './infrastructure/models/cv.schema';
import { CvJobsPortImplementation } from './infrastructure/ports/cv-jobs.port-implementation';
import { LocalFileStoragePortImplementation } from './infrastructure/ports/local-file-storage.port-implementation';
import { PdfTextPortImplementation } from './infrastructure/ports/pdf-text.port-implementation';
import { MikroOrmCvRepository } from './infrastructure/repositories/mikro-orm-cv.repository';
import { CvController } from './interfaces/controllers/cv.controller';

@Module({
  imports: [MikroOrmModule.forFeature([cvSchema]), SessionModule],
  controllers: [CvController],
  providers: [
    InitCvUseCase,
    GetCvUseCase,
    AdvanceCvStepUseCase,
    ExtractFactsUseCase,
    ApplyAnswersUseCase,
    SubmitAnswersUseCase,
    VerifyEvidenceUseCase,
    GenerateQuestionsUseCase,
    ParsePdfUseCase,
    FailCvUseCase,
    ParsePdfWorker,
    ExtractFactsWorker,
    ApplyAnswersWorker,
    VerifyEvidenceWorker,
    TailorToRoleWorker,
    GenerateQuestionsWorker,
    { provide: CV_REPOSITORY, useClass: MikroOrmCvRepository },
    { provide: PDF_TEXT_PORT, useClass: PdfTextPortImplementation },
    { provide: CV_JOBS_PORT, useClass: CvJobsPortImplementation },
    {
      provide: FILE_STORAGE_PORT,
      useClass: LocalFileStoragePortImplementation,
    },
  ],
})
export class CvModule {}
