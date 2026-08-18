import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "./src/lib/env";
import * as schema from "./db/schema";
import { oneToOneSessions } from "./db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const pool = new pg.Pool({ connectionString: env.databaseUrl });
  const db = drizzle(pool, { schema });

  const sessions = await db.select().from(oneToOneSessions).limit(5);
  console.log("O2O Sessions found:", sessions.length);
  process.exit(0);
}
main().catch(console.error);
