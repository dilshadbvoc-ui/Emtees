import { getDb } from "./src/queries/connection";
import { studentClassAllocations } from "./db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const db = getDb();
  await db.update(studentClassAllocations).set({
    allocation: { test: "this_should_be_in_json", oneToOne: { designatedTime: "12:34" } } as any
  }).where(eq(studentClassAllocations.studentId, 7));

  const result = await db.select({ allocation: studentClassAllocations.allocation }).from(studentClassAllocations).where(eq(studentClassAllocations.studentId, 7));
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
run();
