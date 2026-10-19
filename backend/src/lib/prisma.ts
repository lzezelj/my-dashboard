import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const testSchema = process.env.NODE_ENV === 'test' ? process.env.DATABASE_TEST_SCHEMA : undefined;
if (testSchema && !/^dashboard_test_\d+_\d+$/.test(testSchema))
  throw new Error(`Unsafe database test schema: ${testSchema}`);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
  allowExitOnIdle: true,
  max: 5,
  ...(testSchema ? { options: `-c search_path=${testSchema}` } : {}),
});

export const prisma = new PrismaClient({
  adapter,
});
