import 'dotenv/config';
import { inject } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'automated-test-secret';

const schema = inject('databaseTestSchema');
if (!/^dashboard_test_\d+_\d+$/.test(schema))
  throw new Error(`Refusing to run database tests with unsafe schema: ${schema}`);

process.env.DATABASE_TEST_SCHEMA = schema;
if (!process.env.TEST_DATABASE_URL)
  throw new Error('TEST_DATABASE_URL is required for database tests.');
const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
databaseUrl.searchParams.delete('schema');
databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
process.env.DATABASE_URL = databaseUrl.toString();
