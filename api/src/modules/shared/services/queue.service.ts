import { Result } from '../../../common/classes/result.class';

export type QueueOptions = {
  maxRetries: number;
  retryDelaySeconds: number;
  retryBackoff: boolean;
  uniquePerKey: boolean;
};

export type QueueJob<T> = {
  data: T;
  attempt: number;
  maxAttempts: number;
};

export abstract class QueueService {
  abstract createQueue(name: string, options: QueueOptions): Promise<void>;

  abstract enqueue<T extends object>(
    queue: string,
    data: T,
    key?: string,
  ): Promise<Result>;

  abstract process<T extends object>(
    queue: string,
    handler: (job: QueueJob<T>) => Promise<void>,
  ): Promise<void>;
}
