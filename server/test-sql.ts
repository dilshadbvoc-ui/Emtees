import { eq, or, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import "dotenv/config";
import * as schema from './db/schema';
import * as relations from './db/relations';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/emtees' });
const db = drizzle(pool, { schema: { ...schema, ...relations } });

async function run() {
  try {
    const userId = 7;
    const allocatedStudents = await db.select({
      studentId: schema.studentClassAllocations.studentId,
      allocation: schema.studentClassAllocations.allocation,
    }).from(schema.studentClassAllocations).where(
      or(
        sql`CAST(${schema.studentClassAllocations.allocation}->'oneToOne'->>'teacherId' AS INTEGER) = ${userId}`,
        sql`CAST(${schema.studentClassAllocations.allocation}->'group'->>'teacherId' AS INTEGER) = ${userId}`
      )
    );
    console.log('Allocated students count:', allocatedStudents.length);
    console.log(allocatedStudents);
  } catch (err) {
    console.error('ERROR:', err);
  }
  pool.end();
}
run();
