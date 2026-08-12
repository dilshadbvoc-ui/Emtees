import { getDb } from './src/queries/connection.js';
import { studentClassAllocations, batchEnrollments } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { appRouter } from './src/routers/index.ts';
import { createCallerFactory } from '@trpc/server';

const createCaller = createCallerFactory(appRouter);

async function run() {
  const db = getDb();
  
  // Use admin user context
  const caller = createCaller({
    user: { id: 1, role: 'admin' },
    req: {} as any,
    res: {} as any
  });

  const studentId = 27;

  try {
    const result = await caller.students.updateClassAllocation({
      studentId: studentId,
      allocation: {
        oneToOne: {
          teacherId: 25,
          designatedTime: "14:30",
          sessions30: 10,
          sessions45: 5,
          sessions60: 0
        },
        group: {
          teacherId: null,
          batchId: null,
          designatedTime: "",
          sessions30: 0,
          sessions45: 0,
          sessions60: 0
        }
      }
    });

    console.log("Mutation result:", result);

    const alloc = await db.query.studentClassAllocations.findFirst({
      where: eq(studentClassAllocations.studentId, studentId)
    });
    console.log("DB Alloc after mutation:", JSON.stringify(alloc, null, 2));

  } catch(e) {
    console.error("Mutation failed:", e);
  }
}

run().catch(console.error).then(() => process.exit(0));
