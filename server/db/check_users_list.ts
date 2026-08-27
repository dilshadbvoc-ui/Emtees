import { getDb } from "../src/queries/connection.js";
import { users } from "./schema.js";
import { eq, desc } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const db = getDb();
  
  const list = await db.query.users.findMany({
    where: eq(users.role, "teacher"),
    limit: 10,
    orderBy: desc(users.createdAt),
    with: { profile: true, departmentTeachers: true },
  });
  
  console.log("Teachers from query:");
  for (const u of list) {
    console.log(`- ${u.name} (ID: ${u.id})`);
    console.log(`  departmentTeachers:`, u.departmentTeachers);
    console.log(`  Derived departmentId:`, u.departmentTeachers?.[0]?.departmentId);
  }
  process.exit(0);
}
run().catch(console.error);
