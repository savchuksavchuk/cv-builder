import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { CvResponseDTO } from '../../application/responses/cv-response.dto';
import { SubmitAnswersDto } from '../../application/dto/submit-answers.dto';
import { SubmitAnswersUseCase } from '../../application/use-cases/submit-answers.use-case';
import { GetCvUseCase } from '../../application/use-cases/get-cv.use-case';
import { InitCvUseCase } from '../../application/use-cases/init-cv.use-case';

@ApiTags('cvs')
@Controller('cvs')
@UseGuards(AuthGuard)
@ApiSecurity('session')
export class CvController {
  constructor(
    private readonly initCv: InitCvUseCase,
    private readonly getCv: GetCvUseCase,
    private readonly submitAnswers: SubmitAnswersUseCase,
  ) {}

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

  @Get(':id')
  async get(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CvResponseDTO> {
    return this.getCv.execute(user.sub, id);
  }

  @Post(':id/answers')
  @HttpCode(202)
  async answer(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswersDto,
  ): Promise<CvResponseDTO> {
    return this.submitAnswers.execute(user.sub, id, dto);
  }
}
