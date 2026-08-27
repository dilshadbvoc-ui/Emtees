import { getDb } from "../src/queries/connection.js";
import { users, departmentTeachers } from "./schema.js";
import { inArray } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const db = getDb();
  
  const teachers = await db.query.users.findMany({
    where: (users, { eq }) => eq(users.role, "teacher"),
    with: { departmentTeachers: true }
  });
  
  for (const t of teachers) {
    console.log(`${t.name} (${t.unionId}) - ID: ${t.id} - Depts: ${t.departmentTeachers.map(dt => dt.departmentId).join(", ")}`);
  }
  process.exit(0);
}
run().catch(console.error);
