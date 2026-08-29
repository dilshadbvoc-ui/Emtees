import { getDb } from "./src/queries/connection";
import { users, profiles, batches, batchEnrollments, studentClassAllocations, qualifications } from "./db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

async function main() {
  const db = getDb();
  const items = await db
    .select({
      id: users.id,
      courseId: sql<number | null>`COALESCE(${profiles.moduleId}, ${batches.moduleId})`,
      courseIdOld: batches.moduleId
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .leftJoin(batchEnrollments, and(eq(users.id, batchEnrollments.studentId), eq(batchEnrollments.status, "active")))
    .leftJoin(batches, eq(batchEnrollments.batchId, batches.id))
    .where(eq(users.role, "student"))
    .limit(5)
    .orderBy(desc(users.createdAt));

  console.log(items);
}
main().catch(console.error);
