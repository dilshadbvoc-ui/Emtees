import { appRouter } from "./src/router";
import { createContext } from "./src/context";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@db/schema";
import { eq } from "drizzle-orm";
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

  console.log("Calling updateClassAllocation...");
  try {
    await caller.students.updateClassAllocation({
      studentId: 18,
      allocation: {
        oneToOne: {
          teacherId: 25,
          designatedTime: "10:30 AM",
          sessions30: 4,
          sessions45: 0,
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
  } catch (err: any) {
    console.log("Error:", err.message);
  }
  
  const alloc = await db.query.studentClassAllocations.findFirst({ where: eq(schema.studentClassAllocations.studentId, 18) });
  console.log("Alloc:", JSON.stringify(alloc?.allocation, null, 2));

  process.exit(0);
}
main().catch(console.error);
