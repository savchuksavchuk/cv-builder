import { renderCvHtml } from '@cv-builder/cv-template';
import { getDocumentProxy } from 'unpdf';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PdfTextPortImplementation } from '../../src/modules/cv/infrastructure/ports/pdf-text.port-implementation';
import { PuppeteerPdfRendererPortImplementation } from '../../src/modules/cv/infrastructure/ports/puppeteer-pdf-renderer.port-implementation';
import { completedCv } from '../fixtures/cv.fixture';

describe('PDF export with a real browser', () => {
  const renderer = new PuppeteerPdfRendererPortImplementation();
  let pdf: Buffer;

  beforeAll(async () => {
    const { document } = completedCv('user-1').getSnapshot();
    const rendered = await renderer.render(renderCvHtml(document!));

    expect(rendered.success).toBe(true);
    pdf = rendered.dto!;
  });

  afterAll(() => renderer.onModuleDestroy());

  it('produces a PDF file', () => {
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('keeps the text selectable', async () => {
    const extracted = await new PdfTextPortImplementation().extractText(pdf);

    expect(extracted.success).toBe(true);
    expect(extracted.dto).toContain('Jane Doe');
    expect(extracted.dto).toContain('Original summary');
  });

  it('uses A4 pages', async () => {
    const document = await getDocumentProxy(new Uint8Array(pdf));
    const { width, height } = (await document.getPage(1)).getViewport({
      scale: 1,
    });

    expect(width).toBeCloseTo(595, -1);
    expect(height).toBeCloseTo(842, -1);
  });
});
