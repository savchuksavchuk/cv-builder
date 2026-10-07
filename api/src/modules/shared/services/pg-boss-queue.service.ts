import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';
import { Result, ResultBuilder } from '../../../common/classes/result.class';
import { QueueJob, QueueOptions, QueueService } from './queue.service';

@Injectable()
export class PgBossQueueService
  extends QueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PgBossQueueService.name);

  private readonly boss: PgBoss;

  constructor(config: ConfigService) {
    super();
    this.boss = new PgBoss({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    this.boss.on('error', (error) => this.logger.error(error));
  }

  async onModuleInit(): Promise<void> {
    await this.boss.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true });
  }

  async createQueue(name: string, options: QueueOptions): Promise<void> {
    await this.boss.createQueue(name, {
      policy: options.uniquePerKey ? 'exclusive' : 'standard',
      retryLimit: options.maxRetries,
      retryDelay: options.retryDelaySeconds,
      retryBackoff: options.retryBackoff,
    });
  }

  async enqueue<T extends object>(
    queue: string,
    data: T,
    key?: string,
  ): Promise<Result> {
    const builder = new ResultBuilder();

    try {
      await this.boss.send(queue, data, key ? { singletonKey: key } : {});
      return builder.setSuccess(true).build();
    } catch (error) {
      this.logger.error(`Failed to enqueue to ${queue}: ${String(error)}`);
      return builder
        .setSuccess(false)
        .setMessage('Could not enqueue the job')
        .build();
    }
  }

  async process<T extends object>(
    queue: string,
    handler: (job: QueueJob<T>) => Promise<void>,
  ): Promise<void> {
    await this.boss.work<T, void, { includeMetadata: true }>(
      queue,
      { includeMetadata: true },
      async ([job]) =>
        handler({
          data: job.data,
          attempt: job.retryCount + 1,
          maxAttempts: job.retryLimit + 1,
        }),
    );
  }
}
