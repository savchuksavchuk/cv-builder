import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  Result,
  ResultBuilder,
} from '../../../../../../src/common/classes/result.class';
import type { PdfRendererPort } from '../../../../../../src/modules/cv/application/ports/pdf-renderer.port';
import { InMemoryCvRepository } from '../../../../../fakes/in-memory-cv.repository';
import {
  completedCv,
  cvWaitingForAnswers,
} from '../../../../../fixtures/cv.fixture';
import { ExportCvPdfUseCase } from '../../../../../../src/modules/cv/application/use-cases/export-cv-pdf.use-case';

class FakePdfRenderer implements PdfRendererPort {
  renderedHtml: string[] = [];

  render(html: string): Promise<Result<Buffer>> {
    this.renderedHtml.push(html);
    const pdf = Buffer.from('%PDF-fake');
    return Promise.resolve(
      new ResultBuilder<Buffer>().setSuccess(true).setDto(pdf).build(),
    );
  }
}

// The template package is an ES module, which jest cannot load.
jest.mock('@cv-builder/cv-template', () => ({
  renderCvHtml: () => '<html></html>',
}));

describe('ExportCvPdfUseCase', () => {
  const owner = 'user-1';
  const stranger = 'user-2';

  let cvs: InMemoryCvRepository;
  let renderer: FakePdfRenderer;
  let exportPdf: ExportCvPdfUseCase;

  beforeEach(() => {
    cvs = new InMemoryCvRepository();
    renderer = new FakePdfRenderer();
    exportPdf = new ExportCvPdfUseCase(cvs, renderer);
  });

  it('renders the PDF of a completed CV for its owner', async () => {
    const cv = cvs.add(completedCv(owner));

    const { pdf, fileName } = await exportPdf.execute(owner, cv.id);

    expect(pdf.toString()).toBe('%PDF-fake');
    expect(fileName).toBe('Jane-Doe_Backend-Engineer.pdf');
    expect(renderer.renderedHtml).toHaveLength(1);
  });

  it('does not render the CV of another user', async () => {
    const cv = cvs.add(completedCv(owner));

    await expect(exportPdf.execute(stranger, cv.id)).rejects.toThrow(
      new NotFoundException('CV not found'),
    );

    expect(renderer.renderedHtml).toEqual([]);
  });

  it('does not render a CV that is not completed', async () => {
    const cv = cvs.add(cvWaitingForAnswers(owner));

    await expect(exportPdf.execute(owner, cv.id)).rejects.toThrow(
      ConflictException,
    );

    expect(renderer.renderedHtml).toEqual([]);
  });
});
