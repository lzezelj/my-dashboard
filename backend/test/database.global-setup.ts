import { config } from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

config({ path: '.env.test', quiet: true });
config({ quiet: true });

const safeDatabaseUrl = () => {
  const value = process.env.TEST_DATABASE_URL;
  if (!value)
    throw new Error(
      'TEST_DATABASE_URL is required. Database tests never use the development DATABASE_URL.',
    );
  const url = new URL(value);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname))
    throw new Error('Database tests are restricted to a local PostgreSQL server.');
  const databaseName = url.pathname.replace(/^\//, '');
  if (!/(?:^|_)test(?:_|$)/i.test(databaseName))
    throw new Error('The test database name must contain "test" as a separate word.');
  if (process.env.DATABASE_URL) {
    const developmentUrl = new URL(process.env.DATABASE_URL);
    if (
      developmentUrl.hostname === url.hostname &&
      developmentUrl.port === url.port &&
      developmentUrl.pathname === url.pathname
    )
      throw new Error('TEST_DATABASE_URL must use a different database than DATABASE_URL.');
  }
  url.searchParams.delete('schema');
  url.searchParams.delete('options');
  return url.toString();
};

export default async function setup() {
  const connectionString = safeDatabaseUrl();
  process.env.DATABASE_URL = connectionString;
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    const migrationsDirectory = path.resolve('prisma/migrations');
    const entries = (await readdir(migrationsDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((first, second) => first.name.localeCompare(second.name));

    for (const entry of entries) {
      const sql = await readFile(
        path.join(migrationsDirectory, entry.name, 'migration.sql'),
        'utf8',
      );
      await client.query(sql);
    }
  } catch (error) {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    throw error;
  } finally {
    client.release();
  }

  return async () => {
    const cleanup = await pool.connect();
    try {
      await cleanup.query('DROP SCHEMA IF EXISTS public CASCADE');
      await cleanup.query('CREATE SCHEMA public');
    } finally {
      cleanup.release();
      await pool.end();
    }
  };
}
