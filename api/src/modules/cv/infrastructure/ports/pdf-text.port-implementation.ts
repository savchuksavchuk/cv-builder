import { Injectable, Logger } from '@nestjs/common';
import { extractText, getDocumentProxy } from 'unpdf';
import { Result, ResultBuilder } from '../../../../common/classes/result.class';
import { PdfTextPort } from '../../application/ports/pdf-text.port';

@Injectable()
export class PdfTextPortImplementation implements PdfTextPort {
  private readonly logger = new Logger(PdfTextPortImplementation.name);

  async extractText(pdf: Buffer): Promise<Result<string>> {
    const builder = new ResultBuilder<string>();

    try {
      const document = await getDocumentProxy(new Uint8Array(pdf));
      const { text } = await extractText(document, { mergePages: true });

      if (!text.trim()) {
        return builder
          .setSuccess(false)
          .setMessage('PDF has no extractable text, paste the text instead')
          .build();
      }

      return builder.setSuccess(true).setDto(text).build();
    } catch (error) {
      this.logger.warn(`PDF parsing failed: ${String(error)}`);
      return builder
        .setSuccess(false)
        .setMessage('PDF could not be read')
        .build();
    }
  }
}
