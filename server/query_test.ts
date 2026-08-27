import { getDb } from "./src/queries/connection";
import { users, departments, departmentModules, batches, batchEnrollments } from "./db/schema";
import { eq, inArray } from "drizzle-orm";

async function run() {
  const db = getDb();
  const allDepts = await db.query.departments.findMany({ with: { departmentModules: true, headUser: true }});
  console.log("Departments:");
  for (const d of allDepts) {
    const mIds = d.departmentModules.map(m => m.moduleId);
    console.log(`- Dept: ${d.name}, Head: ${d.headUser?.name}, Modules: ${mIds.join(",")}`);
    
    if (mIds.length > 0) {
      const bRows = await db.query.batches.findMany({ where: inArray(batches.moduleId, mIds) });
      const bIds = bRows.map(b => b.id);
      console.log(`  - Batches in these modules: ${bIds.join(",")}`);
      
      if (bIds.length > 0) {
        const enrolls = await db.query.batchEnrollments.findMany({ where: inArray(batchEnrollments.batchId, bIds) });
        console.log(`  - Enrollments in these batches: ${enrolls.length}`);
      }
    }
  }

  // Also check all enrollments
  const allEnrolls = await db.query.batchEnrollments.findMany({ with: { batch: true, student: true }});
  console.log("\nAll Enrollments:");
  for (const e of allEnrolls) {
    console.log(`- Student: ${e.student?.name} (ID: ${e.studentId}), Batch: ${e.batch?.name} (Module ID: ${e.batch?.moduleId}), Status: ${e.status}, Payment: ${e.paymentType}`);
  }
  process.exit(0);
}
run();
