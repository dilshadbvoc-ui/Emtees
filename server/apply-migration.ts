import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const connectionString = "postgresql://postgres:emtees123@emteesapp.c302uq0iwo7z.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=verify-full&sslrootcert=./global-bundle.pem";

const pool = new Pool({
  connectionString,
});

async function run() {
  const sql = fs.readFileSync(path.join(".", "db", "migrations", "0002_boring_skin.sql"), "utf-8");
  const statements = sql.split("--> statement-breakpoint");
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log("Executing:", statement);
      await pool.query(statement);
    }
  }
  
  console.log("Migration applied successfully!");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
