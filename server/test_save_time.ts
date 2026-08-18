import { appRouter } from "./src/router";
import { getDb } from "./src/queries/connection";
import { sql } from "drizzle-orm";

async function run() {
  const caller = appRouter.createCaller({
    user: { id: 1, role: "admin", unionId: "ADM001" },
    req: null as any,
    res: null as any
  });

  // STU0022 is student_id = 7 in the list, but union_id = S015 in allocs
  // Let's get the actual user ID for S015 (Test 2 = STU0022)
  const db = getDb();
  const userRow = await db.execute(sql`SELECT id, union_id, name FROM users WHERE name = 'Test 2' LIMIT 1`);
  const studentId = (userRow.rows[0] as any).id;
  console.log("Student:", userRow.rows[0]);

  // Save designated time
  await caller.students.updateClassAllocation({
    studentId,
    allocation: {
      oneToOne: { teacherId: 15, designatedTime: "09:00", sessions30: 30, sessions45: 0, sessions60: 0 },
      group: { teacherId: null, batchId: null, designatedTime: "", sessions30: 0, sessions45: 0, sessions60: 0 }
    }
  });

  // Read back
  const after = await db.execute(sql`
    SELECT allocation->'oneToOne'->>'designatedTime' as dt FROM student_class_allocations WHERE student_id = ${studentId}
  `);
  console.log("designatedTime after save:", (after.rows[0] as any).dt);
  process.exit(0);
}
run();
