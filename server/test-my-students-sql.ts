import { getDb } from './src/queries/connection';
import * as schema from './db/schema';
import { eq, and, inArray, or } from 'drizzle-orm';

function run() {
  const db = getDb();
  const moduleIds = [2];

  const query = db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          username: schema.users.username,
          batchName: schema.batches.name,
          profileModuleId: schema.profiles.moduleId,
        })
        .from(schema.users)
        .innerJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
        .leftJoin(schema.batchEnrollments, and(eq(schema.batchEnrollments.studentId, schema.users.id), eq(schema.batchEnrollments.status, "active")))
        .leftJoin(schema.batches, eq(schema.batchEnrollments.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.users.role, "student"),
            or(
              inArray(schema.profiles.moduleId, moduleIds),
              inArray(schema.batches.moduleId, moduleIds)
            )
          )
        );
        
  console.log(query.toSQL());
  process.exit(0);
}
run();
