import { getDb } from "../src/queries/connection.js";
import { departments, departmentModules, users, departmentTeachers } from "./schema.js";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const db = getDb();
  
  const depts = await db.query.departments.findMany({
    with: {
      departmentModules: true,
      departmentTeachers: true,
    }
  });
  
  console.log("Departments:");
  for (const d of depts) {
    console.log(`- ${d.name} (ID: ${d.id})`);
    console.log(`  Modules: ${d.departmentModules.map(m => m.moduleId).join(", ")}`);
    console.log(`  Teachers: ${d.departmentTeachers.map(t => t.teacherId).join(", ")}`);
  }
  process.exit(0);
}
run().catch(console.error);
