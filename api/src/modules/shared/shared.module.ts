import { Global, Module } from '@nestjs/common';
import { PasswordHasher } from './services/password-hasher.service';
import { AnthropicLlmService } from './services/anthropic-llm.service';
import { LlmService } from './services/llm.service';
import { PgBossQueueService } from './services/pg-boss-queue.service';
import { QueueService } from './services/queue.service';
import { TransactionService } from './services/transaction.service';

@Global()
@Module({
  providers: [
    PasswordHasher,
    TransactionService,
    { provide: QueueService, useClass: PgBossQueueService },
    { provide: LlmService, useClass: AnthropicLlmService },
  ],
  exports: [PasswordHasher, TransactionService, QueueService, LlmService],
})
export class SharedModule {}
