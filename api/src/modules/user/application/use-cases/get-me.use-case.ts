import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { MeResponseDTO } from '../responses/me-response.dto';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string): Promise<MeResponseDTO> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return MeResponseDTO.toResponse(user.getSnapshot());
  }
}
