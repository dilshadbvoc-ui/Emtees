import { appRouter } from "./src/router";
import { createContext } from "./src/context";
import { getDb } from "./src/queries/connection";

async function main() {
  const ctx = {
    user: { id: 1, role: "admin", username: "admin", name: "Admin" },
    req: {} as any,
    res: {} as any,
  };
  const caller = appRouter.createCaller(ctx);
  try {
    const res = await caller.department.list();
    console.log("Success", res.length);
  } catch (err) {
    console.error("TRPC Error:", err);
  }
}

main().catch(console.error);
