import { getDb } from "./src/queries/connection";
import { users, departments, departmentModules, batches, batchEnrollments } from "./db/schema";
import { eq, inArray } from "drizzle-orm";

async function run() {
  const db = getDb();
  const allDepts = await db.select().from(departments);
  console.log("Departments:");
  for (const d of allDepts) {
    const dModules = await db.select().from(departmentModules).where(eq(departmentModules.departmentId, d.id));
    const mIds = dModules.map(m => m.moduleId);
    console.log(`- Dept: ${d.name}, Modules: ${mIds.join(",")}`);
    
    if (mIds.length > 0) {
      const bRows = await db.select().from(batches).where(inArray(batches.moduleId, mIds));
      const bIds = bRows.map(b => b.id);
      console.log(`  - Batches in these modules: ${bIds.join(",")}`);
      
      if (bIds.length > 0) {
        const enrolls = await db.select().from(batchEnrollments).where(inArray(batchEnrollments.batchId, bIds));
        console.log(`  - Enrollments in these batches: ${enrolls.length}`);
      }
    }
  }

  // Also check all enrollments
  const allEnrolls = await db.select().from(batchEnrollments);
  console.log(`\nTotal Enrollments: ${allEnrolls.length}`);
  
  process.exit(0);
}
run();
