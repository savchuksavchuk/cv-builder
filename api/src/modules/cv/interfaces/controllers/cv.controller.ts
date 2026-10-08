import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { CvListResponseDTO } from '../../application/responses/cv-list-response.dto';
import { ListCvsUseCase } from '../../application/use-cases/list-cvs.use-case';
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
import { UpdateCvDto } from '../../application/dto/update-cv.dto';
import { UpdateCvUseCase } from '../../application/use-cases/update-cv.use-case';
import { ExportCvPdfUseCase } from '../../application/use-cases/export-cv-pdf.use-case';
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
    private readonly listCvs: ListCvsUseCase,
    private readonly submitAnswers: SubmitAnswersUseCase,
    private readonly updateCv: UpdateCvUseCase,
    private readonly exportPdf: ExportCvPdfUseCase,
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

  @Get()
  async list(
    @CurrentUser() user: UserPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<CvListResponseDTO> {
    return this.listCvs.execute(user.sub, query);
  }

  @Get(':id')
  async get(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CvResponseDTO> {
    return this.getCv.execute(user.sub, id);
  }

  @Get(':id/pdf')
  @ApiProduces('application/pdf')
  async pdf(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const { pdf, fileName } = await this.exportPdf.execute(user.sub, id);

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${fileName}"`,
    });
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

  @Patch(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCvDto,
  ): Promise<CvResponseDTO> {
    return this.updateCv.execute(user.sub, id, dto);
  }
}
