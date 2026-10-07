import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import type { UserPayload } from '../../../../common/types/user-payload.type';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { MeResponseDTO } from '../../application/responses/me-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly getMe: GetMeUseCase) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiSecurity('session')
  async me(@CurrentUser() user: UserPayload): Promise<MeResponseDTO> {
    return this.getMe.execute(user.sub);
  }
}
