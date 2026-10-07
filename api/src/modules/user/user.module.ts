import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SessionModule } from '../auth/session.module';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { userSchema } from './infrastructure/models/user.schema';
import { MikroOrmUserRepository } from './infrastructure/repositories/mikro-orm-user.repository';
import { UserAdapter } from './interfaces/adapters/user.adapter';
import { UserController } from './interfaces/controllers/user.controller';

@Module({
  imports: [MikroOrmModule.forFeature([userSchema]), SessionModule],
  controllers: [UserController],
  providers: [
    GetMeUseCase,
    UserAdapter,
    { provide: USER_REPOSITORY, useClass: MikroOrmUserRepository },
  ],
  exports: [UserAdapter],
})
export class UserModule {}
