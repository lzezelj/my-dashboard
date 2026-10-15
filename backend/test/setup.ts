import { config } from 'dotenv';

config({ path: '.env.test', quiet: true });
config({ quiet: true });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'automated-test-secret';

if (!process.env.TEST_DATABASE_URL)
  throw new Error('TEST_DATABASE_URL is required for database tests.');
const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
databaseUrl.searchParams.delete('schema');
databaseUrl.searchParams.delete('options');
process.env.DATABASE_URL = databaseUrl.toString();
