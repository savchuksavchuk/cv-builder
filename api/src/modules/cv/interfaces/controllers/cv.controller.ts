import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PdfFilePipe } from '../../../../common/pipes/pdf-file.pipe';
import type { UserPayload } from '../../../../common/types/user-payload.type';
import {
  MAX_INPUT_CHARS,
  MAX_TARGET_ROLE_CHARS,
} from '../../domain/constants/cv-limits.constants';
import { InitCvDto } from '../../application/dto/init-cv.dto';
import { InitCvResponseDTO } from '../../application/responses/init-cv-response.dto';
import { InitCvUseCase } from '../../application/use-cases/init-cv.use-case';

@ApiTags('cvs')
@Controller('cvs')
@UseGuards(AuthGuard)
@ApiSecurity('session')
export class CvController {
  constructor(private readonly initCv: InitCvUseCase) {}

  @Post()
  @HttpCode(202)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['targetRole'],
      properties: {
        targetRole: { type: 'string', maxLength: MAX_TARGET_ROLE_CHARS },
        text: { type: 'string', maxLength: MAX_INPUT_CHARS },
        file: { type: 'string', format: 'binary' },
      },
      description: 'Send text, a PDF file (text layer, up to 10 MB), or both',
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1 } }))
  async init(
    @CurrentUser() user: UserPayload,
    @Body() dto: InitCvDto,
    @UploadedFile(new PdfFilePipe()) file?: Express.Multer.File,
  ) {
    return this.initCv.execute(user.sub, dto, file);
  }
}
