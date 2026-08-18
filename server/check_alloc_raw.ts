import { getDb } from "./src/queries/connection";
import { sql } from "drizzle-orm";

async function run() {
  const db = getDb();
  // STU0022 has user ID 7
  const result = await db.execute(sql`SELECT allocation FROM student_class_allocations WHERE student_id = 7`);
  console.log("Raw DB Allocation:", JSON.stringify(result.rows[0].allocation, null, 2));
  process.exit(0);
}
run();
