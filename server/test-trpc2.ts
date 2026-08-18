import { appRouter } from "./src/router";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";
import { config } from "dotenv";
config();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  const caller = appRouter.createCaller({
    user: { id: 1, role: "super_admin", iat: 123, exp: 456 },
    req: {} as any,
    res: {} as any,
    io: {} as any,
  });

  const students = await caller.students.list({ limit: 100, page: 1 });
  const pathu = students.items.find((s: any) => s.id === 18);
  console.log("Pathu classAllocation:", JSON.stringify(pathu?.classAllocation, null, 2));

  process.exit(0);
}
main().catch(console.error);
