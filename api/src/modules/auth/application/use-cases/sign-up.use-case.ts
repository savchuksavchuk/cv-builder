import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PasswordHasher } from '../../../shared/services/password-hasher.service';
import { USERS_PORT } from '../ports/users.port';
import type { UsersPort } from '../ports/users.port';

@Injectable()
export class SignUpUseCase {
  private readonly logger = new Logger(SignUpUseCase.name);

  constructor(
    @Inject(USERS_PORT) private readonly users: UsersPort,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(password);

    const taken = await this.users.isEmailTaken(email);

    if (taken.dto) {
      // Do not tell the client the email is taken: the response must be identical
      // for new and existing emails, otherwise sign-up leaks which emails are registered
      // (user enumeration). The attempt is only logged on the server.
      this.logger.warn(`Sign-up attempt with an existing email: ${email}`);
      return;
    }

    const result = await this.users.create(email, passwordHash);

    if (!result.success) {
      throw new InternalServerErrorException(result.message);
    }
  }
}
