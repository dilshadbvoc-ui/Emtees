import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "./src/lib/env";
import * as schema from "./db/schema";
import { classes, users, attendance } from "./db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import path from "path";

async function main() {
  const pool = new pg.Pool({ connectionString: env.databaseUrl });
  const db = drizzle(pool, { schema });

  const allClasses = await db
    .select({
      classId: classes.id,
      title: classes.title,
      teacherName: users.name,
      startedAt: classes.startedAt,
      endedAt: classes.endedAt,
      classType: classes.classType,
    })
    .from(classes)
    .leftJoin(users, eq(classes.teacherId, users.id))
    .orderBy(desc(classes.startedAt))
    .limit(200);

  console.log("Classes found:", allClasses.length);
  if (allClasses.length > 0) {
    console.log("Sample class:", allClasses[0]);
  }
  process.exit(0);
}
main().catch(console.error);
