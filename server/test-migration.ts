import { Pool } from "pg";
import { env } from "./server/src/lib/env";
import fs from "fs";

async function run() {
  const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  const sql = fs.readFileSync("./server/db/migrations/0008_flowery_mandroid.sql", "utf-8");
  try {
    await pool.query(sql);
    console.log("Success");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    pool.end();
  }
}
run();
