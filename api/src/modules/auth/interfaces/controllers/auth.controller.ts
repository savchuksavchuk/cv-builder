import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SignInUseCase } from '../../application/use-cases/sign-in.use-case';
import { SignOutUseCase } from '../../application/use-cases/sign-out.use-case';
import { SignUpUseCase } from '../../application/use-cases/sign-up.use-case';
import {
  AuthGuard,
  SESSION_COOKIE,
} from '../../../../common/guards/auth.guard';
import type { AuthenticatedRequest } from '../../../../common/guards/auth.guard';
import { CredentialsDto } from '../../application/dto/credentials.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUp: SignUpUseCase,
    private readonly signIn: SignInUseCase,
    private readonly signOut: SignOutUseCase,
  ) {}

  @Post('sign-up')
  async signUpHandler(@Body() dto: CredentialsDto): Promise<void> {
    await this.signUp.execute(dto.email, dto.password);
  }

  @Post('sign-in')
  @HttpCode(200)
  async signInHandler(
    @Body() dto: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = await this.signIn.execute(dto.email, dto.password);

    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  @Post('sign-out')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiSecurity('session')
  signOutHandler(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): void {
    this.signOut.execute(req.sessionId);
    res.clearCookie(SESSION_COOKIE);
  }
}
