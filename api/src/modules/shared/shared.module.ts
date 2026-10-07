import { Global, Module } from '@nestjs/common';
import { PasswordHasher } from './services/password-hasher.service';
import { PgBossQueueService } from './services/pg-boss-queue.service';
import { QueueService } from './services/queue.service';
import { TransactionService } from './services/transaction.service';

@Global()
@Module({
  providers: [
    PasswordHasher,
    TransactionService,
    { provide: QueueService, useClass: PgBossQueueService },
  ],
  exports: [PasswordHasher, TransactionService, QueueService],
})
export class SharedModule {}
