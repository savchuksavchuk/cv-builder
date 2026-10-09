import { randomUUID } from 'node:crypto';
import { MikroORM } from '@mikro-orm/postgresql';
import type { ConfigService } from '@nestjs/config';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { CvStep } from '../../../src/modules/cv/domain/types/cv-step';
import { cvSchema } from '../../../src/modules/cv/infrastructure/models/cv.schema';
import { cvStepQueue } from '../../../src/modules/cv/infrastructure/jobs/cv-queues.constants';
import { PgBossQueueService } from '../../../src/modules/shared/services/pg-boss-queue.service';
import { userSchema } from '../../../src/modules/user/infrastructure/models/user.schema';

export type CvRow = {
  status: string;
  current_step: string | null;
  version: number;
  questions: { status: string }[];
};

export type JobRow = { data: { cvId: string }; singleton_key: string | null };

export async function startTestDatabase() {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const url = container.getConnectionUri();

  const orm = await MikroORM.init({
    clientUrl: url,
    entities: [cvSchema, userSchema],
  });
  await orm.schema.create();

  const config = { getOrThrow: () => url } as unknown as ConfigService;
  const queue = new PgBossQueueService(config, orm.em);
  await queue.onModuleInit();

  const connection = orm.em.getConnection();
  const createdQueues = new Set<string>();

  return {
    orm,
    queue,

    async createUser(): Promise<string> {
      const id = randomUUID();
      await orm.em.fork().insert(userSchema, {
        id,
        email: `${id}@example.com`,
        passwordHash: 'hash',
        createdAt: new Date(),
      });
      return id;
    },

    // pg-boss accepts a job only for a queue that exists.
    async createStepQueue(step: CvStep): Promise<void> {
      const name = cvStepQueue(step);
      await queue.createQueue(name, {
        maxRetries: 2,
        retryDelaySeconds: 30,
        retryBackoff: true,
        uniquePerKey: true,
      });
      createdQueues.add(name);
    },

    async cvRows(): Promise<CvRow[]> {
      return connection.execute<CvRow[]>(
        'select status, current_step, version, questions from cvs',
      );
    },

    async cvRow(id: string): Promise<CvRow | undefined> {
      const rows = await connection.execute<CvRow[]>(
        'select status, current_step, version, questions from cvs where id = ?',
        [id],
      );
      return rows[0];
    },

    async jobsIn(queueName: string): Promise<JobRow[]> {
      return connection.execute<JobRow[]>(
        'select data, singleton_key from pgboss.job where name = ?',
        [queueName],
      );
    },

    // Leaves the database as a test needs it: no CVs, and no queues made by earlier tests.
    async reset(): Promise<void> {
      const boss = queue['boss'];
      for (const name of createdQueues) {
        await boss.deleteQueue(name);
      }
      createdQueues.clear();
      await connection.execute('delete from cvs');
    },

    async stop(): Promise<void> {
      await queue.onModuleDestroy();
      await orm.close();
      await container.stop();
    },
  };
}

export type TestDatabase = Awaited<ReturnType<typeof startTestDatabase>>;
