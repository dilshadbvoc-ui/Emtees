import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import "dotenv/config";
import * as schema from './db/schema';
import * as relations from './db/relations';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/emtees' });
const db = drizzle(pool, { schema: { ...schema, ...relations } });

async function run() {
  const all = await db.query.studentClassAllocations.findMany();
  console.log("Total allocations:", all.length);
  const withTeacher = all.filter(a => a.allocation?.oneToOne?.teacherId || a.allocation?.group?.teacherId);
  console.log("Allocations with teacher assigned:", withTeacher.length);
  if (withTeacher.length > 0) {
      console.log(JSON.stringify(withTeacher[0], null, 2));
  }
  pool.end();
}
run();
