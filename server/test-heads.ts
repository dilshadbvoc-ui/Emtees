import { getDb } from './src/queries/connection';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
async function run() {
  const db = getDb();
  const depts = await db.query.departments.findMany();
  for (const d of depts) {
    if (!d.headUserId) continue;
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, d.headUserId)
    });
    console.log(`Dept ${d.name} -> Head: ${user?.username} (ID: ${user?.id})`);
  }
  process.exit(0);
}
run();
