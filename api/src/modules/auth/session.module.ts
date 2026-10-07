import { Module } from '@nestjs/common';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { InMemorySessionRepository } from './infrastructure/repositories/in-memory-session.repository';

@Module({
  providers: [
    { provide: SESSION_REPOSITORY, useClass: InMemorySessionRepository },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionModule {}
