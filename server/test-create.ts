import { getDb } from './src/queries/connection';
import * as schema from './db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
  const db = getDb();
  try {
    const resultId = 91; // Re-use the user I just created
    // Run getMyStudents logic for HINDI OTO (Module 2)
    const enrollments = await db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          profileModuleId: schema.profiles.moduleId,
        })
        .from(schema.users)
        .innerJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .leftJoin(schema.batchEnrollments, and(eq(schema.batchEnrollments.studentId, schema.users.id), eq(schema.batchEnrollments.status, "active")))
        .leftJoin(schema.batches, eq(schema.batchEnrollments.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.users.id, resultId),
            eq(schema.users.role, "student"),
            or(
              inArray(schema.profiles.moduleId, [2]),
              inArray(schema.batches.moduleId, [2])
            )
          )
        );
    console.log("Enrollments query result:", enrollments);

  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
