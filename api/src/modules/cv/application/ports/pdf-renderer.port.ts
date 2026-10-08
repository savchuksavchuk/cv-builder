import { Result } from '../../../../common/classes/result.class';

export interface PdfRendererPort {
  render(html: string): Promise<Result<Buffer>>;
}

export const PDF_RENDERER_PORT = Symbol('PDF_RENDERER_PORT');
