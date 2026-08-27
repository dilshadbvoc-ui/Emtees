import { getDb } from './src/queries/connection';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
async function run() {
  const db = getDb();
  const academicHeads = await db.select().from(schema.users).where(eq(schema.users.role, 'academic_head'));
  console.log("Academic Heads in users table:");
  for (const ah of academicHeads) {
    const isHead = await db.query.departments.findFirst({
      where: eq(schema.departments.headUserId, ah.id)
    });
    console.log(`User ${ah.username} (ID: ${ah.id}) -> Head of Department: ${isHead?.name || 'NONE'}`);
  }
  process.exit(0);
}
run();
