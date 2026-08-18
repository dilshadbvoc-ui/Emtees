import { getDb } from "./src/queries/connection";
import { sql } from "drizzle-orm";

async function run() {
  const db = getDb();
  // Check all allocations that have designatedTime set
  const result = await db.execute(sql`
    SELECT sca.student_id, u.name, u.union_id, 
           sca.allocation->'oneToOne'->>'teacherId' as o2o_teacher,
           sca.allocation->'oneToOne'->>'designatedTime' as o2o_time,
           sca.allocation->'group'->>'teacherId' as grp_teacher,
           sca.allocation->'group'->>'designatedTime' as grp_time
    FROM student_class_allocations sca
    JOIN users u ON u.id = sca.student_id
    ORDER BY sca.updated_at DESC
    LIMIT 20
  `);
  console.log("All allocations:");
  result.rows.forEach((r: any) => {
    console.log(`${r.union_id} (${r.name}): o2o_teacher=${r.o2o_teacher}, o2o_time="${r.o2o_time}", grp_teacher=${r.grp_teacher}, grp_time="${r.grp_time}"`);
  });
  process.exit(0);
}
run();
