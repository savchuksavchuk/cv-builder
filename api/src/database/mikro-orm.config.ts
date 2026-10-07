import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities: ['dist/**/*.schema.js'],
  extensions: [Migrator],
  migrations: {
    path: 'dist/database/migrations',
    emit: 'ts',
  },
});
