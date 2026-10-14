import 'dotenv/config';
import { inject } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'automated-test-secret';

const schema = inject('databaseTestSchema');
const databaseUrl = new URL(process.env.DATABASE_URL!);
databaseUrl.searchParams.delete('schema');
databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
process.env.DATABASE_URL = databaseUrl.toString();
