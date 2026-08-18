import { appRouter } from "./src/router";

async function run() {
  const caller = appRouter.createCaller({
    user: { id: 1, role: "admin", unionId: "ADM001" },
    req: null as any,
    res: null as any
  });

  const listResult = await caller.students.list({ search: "STU0022" });
  console.log(JSON.stringify(listResult.items[0]?.classAllocation, null, 2));
  process.exit(0);
}
run();
