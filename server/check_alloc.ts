import { getDb } from "./src/queries/connection";
import { studentClassAllocations } from "./db/schema";

async function run() {
  const db = getDb();
  const allocs = await db.select().from(studentClassAllocations).limit(5);
  console.log(JSON.stringify(allocs, null, 2));
  process.exit(0);
}
run();
