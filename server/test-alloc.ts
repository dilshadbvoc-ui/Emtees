import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "./src/lib/env";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const pool = new pg.Pool({ connectionString: env.databaseUrl });
  const db = drizzle(pool, { schema });

  const student = await db.query.users.findFirst({ where: eq(schema.users.unionId, "STU0014") });
  if (!student) return console.log("Student not found");

  const alloc = await db.query.studentClassAllocations.findFirst({ where: eq(schema.studentClassAllocations.studentId, student.id) });
  console.log("Alloc:", JSON.stringify(alloc?.allocation, null, 2));

  const enrollment = await db.query.batchEnrollments.findFirst({ where: eq(schema.batchEnrollments.studentId, student.id), orderBy: schema.batchEnrollments.id });
  console.log("Enrollment:", JSON.stringify(enrollment, null, 2));

  process.exit(0);
}
main().catch(console.error);
