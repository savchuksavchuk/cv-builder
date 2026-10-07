import { Result } from '../../../../common/classes/result.class';

export interface PdfTextPort {
  extractText(pdf: Buffer): Promise<Result<string>>;
}

export const PDF_TEXT_PORT = Symbol('PDF_TEXT_PORT');
