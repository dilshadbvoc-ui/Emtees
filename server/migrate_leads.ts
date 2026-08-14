import { Pool } from "pg";
import "dotenv/config";
import fs from "fs";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync("db/migrations/0007_sudden_boomer.sql", "utf-8");
  
  const statements = sql.split("--> statement-breakpoint").filter(s => s.trim().length > 0);
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      console.log("Executing:", stmt.trim());
      await client.query(stmt);
    }
    await client.query("COMMIT");
    console.log("Migration applied successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
