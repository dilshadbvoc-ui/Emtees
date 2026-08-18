import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function run() {
  const teacherId = 15; // T015
  
  // Test query for students allocated to T015
  const rawData = await db.execute(sql`
    SELECT id, "userId", allocation 
    FROM "studentClassAllocations"
    WHERE 
      CAST(allocation->'oneToOne'->>'teacherId' AS INTEGER) = ${teacherId}
      OR CAST(allocation->'group'->>'teacherId' AS INTEGER) = ${teacherId}
  `);

  console.log("Raw Allocations for T015:", JSON.stringify(rawData, null, 2));
  process.exit(0);
}
run().catch(console.error);
