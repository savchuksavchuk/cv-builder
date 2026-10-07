import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { USERS_PORT } from './application/ports/users.port';
import { SignInUseCase } from './application/use-cases/sign-in.use-case';
import { SignOutUseCase } from './application/use-cases/sign-out.use-case';
import { SignUpUseCase } from './application/use-cases/sign-up.use-case';
import { UsersPortImplementation } from './infrastructure/ports/users.port-implementation';
import { AuthController } from './interfaces/controllers/auth.controller';
import { SessionModule } from './session.module';

@Module({
  imports: [UserModule, SessionModule, SharedModule],
  controllers: [AuthController],
  providers: [
    SignUpUseCase,
    SignInUseCase,
    SignOutUseCase,
    { provide: USERS_PORT, useClass: UsersPortImplementation },
  ],
})
export class AuthModule {}
