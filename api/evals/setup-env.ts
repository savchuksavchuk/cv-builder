import { existsSync } from 'node:fs';

if (existsSync('.env.development')) {
  process.loadEnvFile('.env.development');
}

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    'ANTHROPIC_API_KEY is not set (add it to api/.env.development)',
  );
}
