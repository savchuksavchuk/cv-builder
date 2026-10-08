import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { renderCvHtml } from '@cv-builder/cv-template';
import { CV_REPOSITORY } from '../../domain/repositories/cv.repository';
import type { CvRepository } from '../../domain/repositories/cv.repository';
import { CvStatus } from '../../domain/types/cv-status';
import { PDF_RENDERER_PORT } from '../ports/pdf-renderer.port';
import type { PdfRendererPort } from '../ports/pdf-renderer.port';

@Injectable()
export class ExportCvPdfUseCase {
  constructor(
    @Inject(CV_REPOSITORY) private readonly cvs: CvRepository,
    @Inject(PDF_RENDERER_PORT) private readonly renderer: PdfRendererPort,
  ) {}

  async execute(
    userId: string,
    cvId: string,
  ): Promise<{ pdf: Buffer; fileName: string }> {
    const cv = await this.cvs.findByIdForUser(cvId, userId);

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const { status, document, targetRole } = cv.getSnapshot();

    if (status !== CvStatus.Completed || !document) {
      throw new ConflictException('CV is not completed');
    }

    const rendered = await this.renderer.render(renderCvHtml(document));

    if (!rendered.success || !rendered.dto) {
      throw new ServiceUnavailableException(rendered.message);
    }

    const name = [document.header.fullName, targetRole]
      .map(slugify)
      .filter(Boolean)
      .join('_');

    return { pdf: rendered.dto, fileName: `${name || 'cv'}.pdf` };
  }
}

function slugify(value: string | null): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
