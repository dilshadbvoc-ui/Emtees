import { db } from "./server/db/index";
import { profiles, batches, batchEnrollments } from "./server/db/schema";
import { eq, isNull, and } from "drizzle-orm";

async function run() {
  console.log("Starting backfill...");
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
  console.log(`Updated ${count} profiles from active batch enrollments.`);
  process.exit(0);
}
run().catch(console.error);
