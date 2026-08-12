import { getDb } from './src/queries/connection.js';
import { studentClassAllocations } from './db/schema.js';
import { desc } from 'drizzle-orm';

async function run() {
  const db = getDb();
  
  // Find the most recently updated studentClassAllocations
  const recentAllocs = await db.query.studentClassAllocations.findMany({
    orderBy: desc(studentClassAllocations.updatedAt),
    limit: 5
  });

  console.log("Most recent allocations:", JSON.stringify(recentAllocs, null, 2));
}

run().catch(console.error).then(() => process.exit(0));
