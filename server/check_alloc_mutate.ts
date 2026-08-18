import { appRouter } from "./src/router";
import { getDb } from "./src/queries/connection";

async function run() {
  const caller = appRouter.createCaller({
    user: { id: 1, role: "admin", unionId: "ADM001" },
    req: null as any,
    res: null as any
  });

  const studentId = 7; // STU0022 has id 7?
  // Let's first query list to see what we get for STU0022
  const listResult = await caller.students.list({ search: "STU0022" });
  console.log("Before:", JSON.stringify(listResult.items[0]?.classAllocation, null, 2));

  if (listResult.items[0]) {
    await caller.students.updateClassAllocation({
      studentId: listResult.items[0].id,
      allocation: {
        oneToOne: {
          teacherId: 15,
          designatedTime: "10:30",
          sessions30: 30,
          sessions45: 0,
          sessions60: 0
        },
        group: {
          teacherId: null,
          batchId: null,
          designatedTime: "11:00",
          sessions30: 0,
          sessions45: 0,
          sessions60: 0
        }
      }
    });

    const afterResult = await caller.students.list({ search: "STU0022" });
    console.log("After:", JSON.stringify(afterResult.items[0]?.classAllocation, null, 2));
  }
  process.exit(0);
}
run();
