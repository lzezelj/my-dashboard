import 'dotenv/config';
import { afterAll, afterEach, beforeAll, describe, expect, inject, it } from 'vitest';
import { Pool } from 'pg';

const schema = inject('databaseTestSchema');
if (!process.env.TEST_DATABASE_URL)
  throw new Error('TEST_DATABASE_URL is required for database tests.');
const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
databaseUrl.searchParams.delete('schema');
const pool = new Pool({
  connectionString: databaseUrl.toString(),
  max: 1,
  options: `-c search_path=${schema}`,
});

beforeAll(async () => {
  const result = await pool.query<{ current_schema: string }>('SELECT current_schema()');
  if (result.rows[0]?.current_schema !== schema)
    throw new Error(
      `Refusing to run database tests outside ${schema}; connected to ${result.rows[0]?.current_schema}`,
    );
});

afterEach(async () => {
  await pool.query('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});

describe('database configuration', () => {
  it('applies every migration to a fresh schema', async () => {
    const result = await pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1`,
      [schema],
    );
    const tables = result.rows.map(({ table_name }) => table_name);

    expect(tables).toEqual(
      expect.arrayContaining([
        'User',
        'Event',
        'EventOccurrenceOverride',
        'EventRecurrenceDate',
        'EventExclusionDate',
      ]),
    );
  });

  it('creates users and events with database defaults', async () => {
    const user = await pool.query<{ id: number }>(
      `INSERT INTO "User" ("email", "updatedAt")
       VALUES ($1, NOW()) RETURNING "id"`,
      ['database-test@example.com'],
    );
    const event = await pool.query<{ id: number; completed: boolean; allDay: boolean }>(
      `INSERT INTO "Event" ("userId", "category", "title", "date", "updatedAt")
       VALUES ($1, 'OTHER', 'Database test', DATE '2026-10-14', NOW())
       RETURNING "id", "completed", "allDay"`,
      [user.rows[0]!.id],
    );

    expect(event.rows[0]).toMatchObject({ completed: false, allDay: false });
    expect(event.rows[0]!.id).toBeGreaterThan(0);
  });

  it('enforces unique user emails', async () => {
    await pool.query(
      `INSERT INTO "User" ("email", "updatedAt") VALUES ($1, NOW())`,
      ['unique@example.com'],
    );

    await expect(
      pool.query(`INSERT INTO "User" ("email", "updatedAt") VALUES ($1, NOW())`, [
        'unique@example.com',
      ]),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('cascades account deletion through events and recurrence data', async () => {
    const user = await pool.query<{ id: number }>(
      `INSERT INTO "User" ("email", "updatedAt") VALUES ($1, NOW()) RETURNING "id"`,
      ['cascade@example.com'],
    );
    const event = await pool.query<{ id: number }>(
      `INSERT INTO "Event"
         ("userId", "category", "title", "date", "recurring", "updatedAt")
       VALUES ($1, 'OTHER', 'Recurring test', DATE '2026-10-14', 'WEEKLY', NOW())
       RETURNING "id"`,
      [user.rows[0]!.id],
    );
    await pool.query(
      `INSERT INTO "EventOccurrenceOverride" ("eventId", "occurrenceDate", "description")
       VALUES ($1, DATE '2026-10-21', 'Changed')`,
      [event.rows[0]!.id],
    );
    await pool.query(
      `INSERT INTO "EventRecurrenceDate" ("eventId", "value") VALUES ($1, '20261028')`,
      [event.rows[0]!.id],
    );

    await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [user.rows[0]!.id]);

    const remaining = await pool.query<{ count: string }>(
      `SELECT
        (SELECT COUNT(*) FROM "Event") +
        (SELECT COUNT(*) FROM "EventOccurrenceOverride") +
        (SELECT COUNT(*) FROM "EventRecurrenceDate") AS count`,
    );
    expect(Number(remaining.rows[0]!.count)).toBe(0);
  });
});
