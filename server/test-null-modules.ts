import { getDb } from './src/queries/connection';
import * as schema from './db/schema';
import { isNull, isNotNull, and, eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
  const db = getDb();
  const profiles = await db.select().from(schema.profiles).where(and(isNotNull(schema.profiles.course), isNull(schema.profiles.moduleId)));
  console.log(profiles.length, "profiles have course but no moduleId");
  if (profiles.length > 0) {
    console.log(profiles.map(p => ({ user: p.userId, course: p.course })));
  }
  process.exit(0);
}
run();
