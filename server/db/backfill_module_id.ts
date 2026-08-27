import { getDb } from "../src/queries/connection.js";
import { profiles, batches, batchEnrollments } from "./schema.js";
import { eq, isNull, and } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const db = getDb();
  console.log('Fetching active enrollments without moduleId...');
  
  const enrollments = await db.select({
    studentId: batchEnrollments.studentId,
    moduleId: batches.moduleId
  })
  .from(batchEnrollments)
  .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
  .where(eq(batchEnrollments.status, "active"));
  
  let count = 0;
  for (const e of enrollments) {
    if (e.moduleId) {
      await db.update(profiles).set({ moduleId: e.moduleId }).where(eq(profiles.userId, e.studentId));
      count++;
    }
  }
  console.log(`Updated ${count} profiles with moduleId.`);
  process.exit(0);
}
run().catch(console.error);
