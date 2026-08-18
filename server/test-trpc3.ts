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

  console.log("Updating STU0014 via updateClassAllocation...");
  try {
    await caller.students.updateClassAllocation({
      studentId: 18,
      allocation: {
        oneToOne: {
          teacherId: 25,
          designatedTime: "14:30",
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
    console.log("Success!");
  } catch (err: any) {
    console.error("Error:", err);
  }

  const alloc = await db.query.studentClassAllocations.findFirst({ where: pg.eq(schema.studentClassAllocations.studentId, 18) } as any);
  console.log("Alloc from DB:", JSON.stringify(alloc?.allocation, null, 2));

  process.exit(0);
}
main().catch(console.error);
