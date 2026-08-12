import { getDb } from './src/queries/connection.js';
import { studentClassAllocations } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const db = getDb();
  const studentId = 27;

  // Let's just update the json directly and fetch it to see if designatedTime persists
  const newAllocationJson = {
    oneToOne: {
      teacherId: 25,
      designatedTime: "10:30",
      sessions30: 10,
      sessions45: 5,
      sessions60: 0,
      completed30: 0,
      completed45: 0,
      completed60: 0,
      remaining30: 10,
      remaining45: 5,
      remaining60: 0
    },
    group: {
      teacherId: null,
      batchId: null,
      designatedTime: "",
      sessions30: 0,
      sessions45: 0,
      sessions60: 0,
      completed30: 0,
      completed45: 0,
      completed60: 0,
      remaining30: 0,
      remaining45: 0,
      remaining60": 0
    }
  };

  await db.update(studentClassAllocations)
    .set({ allocation: newAllocationJson })
    .where(eq(studentClassAllocations.studentId, studentId));

  const alloc = await db.query.studentClassAllocations.findFirst({
    where: eq(studentClassAllocations.studentId, studentId)
  });
  console.log("DB Alloc after mutation:", JSON.stringify(alloc, null, 2));

}

run().catch(console.error).then(() => process.exit(0));
