import { getDb } from "./src/queries/connection";
import { sql } from "drizzle-orm";
async function main() {
  try {
    const db = getDb();
    const res = await db.execute(sql`SELECT * FROM one_to_one_sessions WHERE id = 16`);
    console.log("One To One Session 16:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
