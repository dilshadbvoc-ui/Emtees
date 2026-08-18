import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import "dotenv/config";
import * as schema from './db/schema';
import * as relations from './db/relations';
import { fetchFullTeacherReportData } from './src/routers/admin';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/emtees' });
const db = drizzle(pool, { schema: { ...schema, ...relations } });

async function run() {
  try {
    const teacher = await db.query.users.findFirst({ where: eq(schema.users.unionId, 'T007') });
    if (!teacher) {
        console.log('Teacher not found');
        return;
    }
    const data = await fetchFullTeacherReportData(db, teacher.id);
    console.log('Students List Length:', data.studentsList?.length);
    if (data.studentsList?.length > 0) {
        console.log('Students List First Item:', JSON.stringify(data.studentsList[0], null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err.stack);
  }
  pool.end();
}
run();
