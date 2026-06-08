import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const pool = new pg.Pool({
      connectionString: env.databaseUrl,
      max: 10,
      idleTimeoutMillis: 10000, // Close idle connections after 10 seconds to avoid Neon sleep disconnects
      connectionTimeoutMillis: 15000, // Give Neon up to 15 seconds to wake up from cold start
    });

    // Catch pool errors so connection timeouts or drops do not crash the Node process
    pool.on("error", (err) => {
      console.error("Unexpected error on idle database client:", err);
    });

    instance = drizzle(pool, { schema: fullSchema });
  }
  return instance;
}
