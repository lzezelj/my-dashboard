import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import type { TestProject } from 'vitest/node';

const safeDatabaseUrl = () => {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is required for database tests.');
  const url = new URL(value);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname))
    throw new Error('Database tests are restricted to a local PostgreSQL server.');
  url.searchParams.delete('schema');
  return url.toString();
};

export default async function setup(project: TestProject) {
  const connectionString = safeDatabaseUrl();
  const schema = `dashboard_test_${process.pid}_${Date.now()}`;
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const migrationsDirectory = path.resolve('prisma/migrations');
    const entries = (await readdir(migrationsDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((first, second) => first.name.localeCompare(second.name));

    for (const entry of entries) {
      const sql = await readFile(path.join(migrationsDirectory, entry.name, 'migration.sql'), 'utf8');
      await client.query(sql);
    }
  } catch (error) {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    throw error;
  } finally {
    client.release();
  }

  project.provide('databaseTestSchema', schema);

  return async () => {
    const cleanup = await pool.connect();
    try {
      await cleanup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      cleanup.release();
      await pool.end();
    }
  };
}

declare module 'vitest' {
  export interface ProvidedContext {
    databaseTestSchema: string;
  }
}
