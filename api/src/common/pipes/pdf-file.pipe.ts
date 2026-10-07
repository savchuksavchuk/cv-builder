import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const PDF_MAGIC = Buffer.from('%PDF-');

@Injectable()
export class PdfFilePipe implements PipeTransform<
  Express.Multer.File | undefined,
  Express.Multer.File | undefined
> {
  constructor(private readonly options: { required?: boolean } = {}) {}

  transform(file?: Express.Multer.File): Express.Multer.File | undefined {
    if (!file) {
      if (this.options.required) {
        throw new BadRequestException('PDF file is required');
      }
      return undefined;
    }
    if (file.size > MAX_PDF_BYTES) {
      throw new PayloadTooLargeException('PDF must be at most 10 MB');
    }
    if (
      file.mimetype !== 'application/pdf' ||
      !file.buffer?.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)
    ) {
      throw new UnsupportedMediaTypeException('File is not a valid PDF');
    }
    return file;
  }
}
